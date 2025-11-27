from flask import Flask, jsonify
from flask_cors import CORS
import random
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Dashboard endpoints
@app.route('/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    # Mock data based on your screenshots
    return jsonify({
        "current_temperature": 18.4,
        "current_humidity": 75.7,
        "temperature_change": -3.5,
        "humidity_change": 1.8,
        "avg_temperature": 20.0,
        "avg_humidity": 80.0
    })

# Sensor data endpoints
@app.route('/sensor/data', methods=['GET'])
def get_sensor_data():
    # Generate mock sensor data
    data = []
    base_date = datetime.utcnow() - timedelta(days=30)
    
    for i in range(30):
        data.append({
            "id": i + 1,
            "temperature": 18 + random.uniform(-2, 2),
            "humidity": 75 + random.uniform(-5, 5),
            "timestamp": (base_date + timedelta(days=i)).isoformat()
        })
    
    return jsonify(data)

# Notifications endpoints
@app.route('/notifications', methods=['GET'])
def get_notifications():
    notifications = [
        {
            "id": 1,
            "title": "Увеличьте температуру на +10°С",
            "message": "Нужно увеличивать температуру для того, чтобы была комфортная температура которая сможет обеспечивать вам что-то, на основе данных, которые были загруженный в систему",
            "completed": True,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": 2,
            "title": "Увеличьте температуру на +10°С",
            "message": "Нужно увеличивать температуру для того, чтобы была комфортная температура которая сможет обеспечивать вам что-то, на основе данных, которые были загруженный в систему",
            "completed": True,
            "created_at": (datetime.utcnow() - timedelta(hours=1)).isoformat()
        }
    ]
    return jsonify(notifications)

# Users endpoints
@app.route('/users', methods=['GET'])
def get_users():
    users = [
        {
            "id": 1,
            "name": "Engineer Kseniya Kruchina",
            "role": "Engineer",
            "status": "online",
            "last_login": datetime.utcnow().isoformat()
        },
        {
            "id": 2,
            "name": "Admin Arthur Kurbanov",
            "role": "Admin",
            "status": "offline",
            "last_login": (datetime.utcnow() - timedelta(hours=2)).isoformat()
        },
        {
            "id": 3,
            "name": "Product Anastasiya Sibirseva",
            "role": "Product",
            "status": "online",
            "last_login": (datetime.utcnow() - timedelta(minutes=30)).isoformat()
        }
    ]
    return jsonify(users)

# User activities endpoints
@app.route('/user-activities', methods=['GET'])
def get_user_activities():
    activities = []
    actions = [
        "Вошла в систему",
        "Включил датчик влажности",
        "Сначала месячный отчет",
        "Вошла в систему",
        "Включил датчик влажности",
        "Сначала месячный отчет",
        "Вошла в систему",
        "Включил датчик влажности"
    ]
    
    users = [
        "Engineer Kseniya Kruchina",
        "Admin Arthur Kurbanov",
        "Product Anastasiya Sibirseva"
    ]
    
    base_time = datetime.utcnow()
    
    for i, action in enumerate(actions):
        activities.append({
            "id": i + 1,
            "user_name": users[i % len(users)],
            "action": action,
            "timestamp": (base_time - timedelta(minutes=len(actions) - i)).isoformat()
        })
    
    return jsonify(activities)

@app.route('/', methods=['GET'])
def read_root():
    return jsonify({"message": "Sensor Dashboard API is running!"})

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
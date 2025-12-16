
import boto3
import json
import time
import random
import datetime

# Configuration
STREAM_NAME = 'real-time-analytics-stream'
REGION_NAME = 'ap-south-1'

# Initialize Kinesis Client
kinesis = boto3.client('kinesis', region_name=REGION_NAME)

USERS = ['alice', 'bob', 'charlie', 'dave', 'eve']
ACTIONS = ['login', 'view_page', 'click_button', 'logout', 'purchase']
PAGES = ['/home', '/dashboard', '/profile', '/settings', '/cart']

def generate_app_event():
    """Generates a random application event."""
    action = random.choice(ACTIONS)
    user = random.choice(USERS)
    
    event = {
        'id': 'global-app-events', # Static ID to allow querying by timestamp
        'event_id': f"evt-{random.randint(1000, 9999)}",
        'timestamp': int(time.time() * 1000),
        'type': 'app_event',
        'user': user,
        'action': action,
        'page': random.choice(PAGES) if action in ['view_page', 'click_button'] else None,
        'meta': {'browser': 'Chrome', 'os': 'Windows'}
    }
    return event

def send_to_kinesis(data):
    try:
        response = kinesis.put_record(
            StreamName=STREAM_NAME,
            Data=json.dumps(data),
            PartitionKey='app-events'
        )
        print(f"[{datetime.datetime.now()}] Sent App Event: {data['user']} -> {data['action']}")
    except Exception as e:
        print(f"Error sending data: {e}")

if __name__ == '__main__':
    print("Starting App Event Simulator...")
    try:
        while True:
            event = generate_app_event()
            send_to_kinesis(event)
            # Random sleep between 0.5 and 3 seconds
            time.sleep(random.uniform(0.5, 3.0))
    except KeyboardInterrupt:
        print("Stopping Simulator.")

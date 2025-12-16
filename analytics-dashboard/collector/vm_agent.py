
import boto3
import json
import time
import psutil
import datetime
import os

# Configuration
STREAM_NAME = 'real-time-analytics-stream'
REGION_NAME = 'ap-south-1'
PARTITION_KEY = 'vm-metrics'

# Initialize Kinesis Client
kinesis = boto3.client('kinesis', region_name=REGION_NAME)

def get_vm_metrics():
    """Collects system metrics."""
    cpu_usage = psutil.cpu_percent(interval=1)
    memory_info = psutil.virtual_memory()
    disk_info = psutil.disk_usage('/')
    
    return {
        'id': 'vm-server-01', # distinct ID for the VM
        'timestamp': int(time.time() * 1000), # Milliseconds
        'type': 'vm_stats',
        'cpu_usage': cpu_usage,
        'memory_total': memory_info.total,
        'memory_used': memory_info.used,
        'memory_percent': memory_info.percent,
        'disk_total': disk_info.total,
        'disk_used': disk_info.used,
        'disk_percent': disk_info.percent,
        'boot_time': psutil.boot_time()
    }

def send_to_kinesis(data):
    """Sends data to Kinesis Stream."""
    try:
        response = kinesis.put_record(
            StreamName=STREAM_NAME,
            Data=json.dumps(data),
            PartitionKey=data['id']
        )
        print(f"[{datetime.datetime.now()}] Sent VM stats to Kinesis: ShardId={response['ShardId']}")
    except Exception as e:
        print(f"Error sending data: {e}")

if __name__ == '__main__':
    print("Starting VM Analytics Agent...")
    print(f"Target Stream: {STREAM_NAME} ({REGION_NAME})")
    
    try:
        while True:
            metrics = get_vm_metrics()
            send_to_kinesis(metrics)
            time.sleep(5) # Collect every 5 seconds
    except KeyboardInterrupt:
        print("Stopping Agent.")

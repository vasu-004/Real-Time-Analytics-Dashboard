"""
VM Metrics Collector
Collects CPU, Memory, Disk, and Network metrics and sends to AWS Kinesis
"""

import boto3
import json
import time
import psutil
import platform
import socket
from datetime import datetime
import uuid

# Configuration
STREAM_NAME = "real-time-analytics-stream"
AWS_REGION = "us-east-1"
COLLECTION_INTERVAL = 10  # seconds

# Initialize Kinesis client
kinesis_client = boto3.client('kinesis', region_name=AWS_REGION)

def get_vm_hostname():
    """Get the VM hostname"""
    return socket.gethostname()

def get_vm_ip():
    """Get the VM IP address"""
    try:
        return socket.gethostbyname(socket.gethostname())
    except:
        return "unknown"

def collect_cpu_metrics():
    """Collect CPU metrics"""
    cpu_percent = psutil.cpu_percent(interval=1)
    cpu_count = psutil.cpu_count()
    cpu_freq = psutil.cpu_freq()
    
    return {
        "usage_percent": round(cpu_percent, 2),
        "count": cpu_count,
        "frequency_mhz": round(cpu_freq.current, 2) if cpu_freq else None,
        "per_core": [round(x, 2) for x in psutil.cpu_percent(interval=1, percpu=True)]
    }

def collect_memory_metrics():
    """Collect memory metrics"""
    memory = psutil.virtual_memory()
    swap = psutil.swap_memory()
    
    return {
        "total_gb": round(memory.total / (1024**3), 2),
        "available_gb": round(memory.available / (1024**3), 2),
        "used_gb": round(memory.used / (1024**3), 2),
        "usage_percent": round(memory.percent, 2),
        "swap_total_gb": round(swap.total / (1024**3), 2),
        "swap_used_gb": round(swap.used / (1024**3), 2),
        "swap_percent": round(swap.percent, 2)
    }

def collect_disk_metrics():
    """Collect disk metrics"""
    disk = psutil.disk_usage('/')
    disk_io = psutil.disk_io_counters()
    
    return {
        "total_gb": round(disk.total / (1024**3), 2),
        "used_gb": round(disk.used / (1024**3), 2),
        "free_gb": round(disk.free / (1024**3), 2),
        "usage_percent": round(disk.percent, 2),
        "read_bytes": disk_io.read_bytes if disk_io else 0,
        "write_bytes": disk_io.write_bytes if disk_io else 0,
        "read_count": disk_io.read_count if disk_io else 0,
        "write_count": disk_io.write_count if disk_io else 0
    }

def collect_network_metrics():
    """Collect network metrics"""
    net_io = psutil.net_io_counters()
    
    return {
        "bytes_sent": net_io.bytes_sent,
        "bytes_recv": net_io.bytes_recv,
        "packets_sent": net_io.packets_sent,
        "packets_recv": net_io.packets_recv,
        "errors_in": net_io.errin,
        "errors_out": net_io.errout,
        "drops_in": net_io.dropin,
        "drops_out": net_io.dropout
    }

def collect_system_info():
    """Collect system information"""
    boot_time = datetime.fromtimestamp(psutil.boot_time())
    
    return {
        "platform": platform.system(),
        "platform_version": platform.version(),
        "architecture": platform.machine(),
        "processor": platform.processor(),
        "hostname": get_vm_hostname(),
        "ip_address": get_vm_ip(),
        "boot_time": boot_time.isoformat(),
        "uptime_hours": round((datetime.now() - boot_time).total_seconds() / 3600, 2)
    }

def send_to_kinesis(data):
    """Send data to Kinesis stream"""
    try:
        response = kinesis_client.put_record(
            StreamName=STREAM_NAME,
            Data=json.dumps(data),
            PartitionKey=data['id']
        )
        
        print(f"✅ Data sent to Kinesis - Shard: {response['ShardId']}, Sequence: {response['SequenceNumber']}")
        return True
    except Exception as e:
        print(f"❌ Error sending to Kinesis: {e}")
        return False

def collect_and_send_metrics():
    """Collect all metrics and send to Kinesis"""
    
    # Generate unique ID for this record
    record_id = str(uuid.uuid4())
    timestamp = int(time.time() * 1000)  # milliseconds
    
    # Collect all metrics
    metrics_data = {
        "id": record_id,
        "timestamp": timestamp,
        "type": "vm-metrics",
        "source": get_vm_hostname(),
        "system_info": collect_system_info(),
        "cpu": collect_cpu_metrics(),
        "memory": collect_memory_metrics(),
        "disk": collect_disk_metrics(),
        "network": collect_network_metrics()
    }
    
    # Print summary
    print(f"\n{'='*70}")
    print(f"🖥️  VM Metrics Collection - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*70}")
    print(f"CPU Usage: {metrics_data['cpu']['usage_percent']}%")
    print(f"Memory Usage: {metrics_data['memory']['usage_percent']}% ({metrics_data['memory']['used_gb']}/{metrics_data['memory']['total_gb']} GB)")
    print(f"Disk Usage: {metrics_data['disk']['usage_percent']}% ({metrics_data['disk']['used_gb']}/{metrics_data['disk']['total_gb']} GB)")
    print(f"Network Sent: {round(metrics_data['network']['bytes_sent'] / (1024**2), 2)} MB")
    print(f"Network Received: {round(metrics_data['network']['bytes_recv'] / (1024**2), 2)} MB")
    
    # Send to Kinesis
    send_to_kinesis(metrics_data)

def main():
    """Main function"""
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║                                                                ║")
    print("║            VM Metrics Collector                                ║")
    print("║            Streaming to AWS Kinesis                            ║")
    print("║                                                                ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print(f"\nStream: {STREAM_NAME}")
    print(f"Region: {AWS_REGION}")
    print(f"Collection Interval: {COLLECTION_INTERVAL} seconds")
    print(f"Hostname: {get_vm_hostname()}")
    print(f"IP Address: {get_vm_ip()}")
    print("\nPress Ctrl+C to stop...\n")
    
    try:
        while True:
            collect_and_send_metrics()
            time.sleep(COLLECTION_INTERVAL)
    except KeyboardInterrupt:
        print("\n\n✋ Stopping VM metrics collector...")
        print("Goodbye! 👋\n")

if __name__ == "__main__":
    main()

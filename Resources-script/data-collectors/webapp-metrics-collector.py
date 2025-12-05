"""
Web Application Metrics Collector
Collects web application performance and usage metrics and sends to AWS Kinesis
Monitors the web application running at the specified URL
"""

import boto3
import json
import time
import requests
import uuid
from datetime import datetime
from collections import deque
import random

# Configuration
STREAM_NAME = "real-time-analytics-stream"
AWS_REGION = "us-east-1"
COLLECTION_INTERVAL = 10  # seconds
WEB_APP_URL = "http://localhost:8000"  # Your web application URL

# Initialize Kinesis client
kinesis_client = boto3.client('kinesis', region_name=AWS_REGION)

# Store recent metrics for trend analysis
recent_response_times = deque(maxlen=100)
request_count = 0
error_count = 0

def check_webapp_health():
    """Check web application health and response time"""
    try:
        start_time = time.time()
        response = requests.get(WEB_APP_URL, timeout=5)
        response_time = (time.time() - start_time) * 1000  # ms
        
        return {
            "status": "online",
            "status_code": response.status_code,
            "response_time_ms": round(response_time, 2),
            "content_length": len(response.content)
        }
    except requests.exceptions.Timeout:
        return {
            "status": "timeout",
            "status_code": 0,
            "response_time_ms": 5000,
            "content_length": 0
        }
    except requests.exceptions.ConnectionError:
        return {
            "status": "offline",
            "status_code": 0,
            "response_time_ms": 0,
            "content_length": 0
        }
    except Exception as e:
        return {
            "status": "error",
            "status_code": 0,
            "response_time_ms": 0,
            "content_length": 0,
            "error": str(e)
        }

def generate_simulated_metrics():
    """
    Generate simulated web app metrics
    In production, replace this with actual metrics from your web application
    """
    
    # Simulate active users (with some variance)
    base_users = 50
    active_users = max(0, base_users + random.randint(-10, 20))
    
    # Simulate request rate (requests per second)
    base_rps = 25
    requests_per_second = max(0, base_rps + random.randint(-5, 15))
    
    # Simulate error rate
    error_rate = round(random.uniform(0, 2), 2)  # 0-2% errors
    
    # Simulate page load times
    avg_page_load = round(random.uniform(200, 800), 2)  # 200-800ms
    
    # Simulate database query time
    avg_db_query = round(random.uniform(10, 100), 2)  # 10-100ms
    
    # Simulate traffic sources
    traffic_sources = {
        "direct": random.randint(20, 40),
        "organic": random.randint(15, 35),
        "referral": random.randint(10, 25),
        "social": random.randint(5, 15)
    }
    
    return {
        "active_users": active_users,
        "requests_per_second": requests_per_second,
        "error_rate_percent": error_rate,
        "avg_page_load_ms": avg_page_load,
        "avg_db_query_ms": avg_db_query,
        "traffic_sources": traffic_sources,
        "total_requests": request_count,
        "total_errors": error_count
    }

def collect_performance_metrics(health_check):
    """Collect application performance metrics"""
    
    # Track response times
    if health_check["response_time_ms"] > 0:
        recent_response_times.append(health_check["response_time_ms"])
    
    # Calculate stats
    if recent_response_times:
        avg_response_time = sum(recent_response_times) / len(recent_response_times)
        min_response_time = min(recent_response_times)
        max_response_time = max(recent_response_times)
    else:
        avg_response_time = 0
        min_response_time = 0
        max_response_time = 0
    
    return {
        "current_response_time_ms": health_check["response_time_ms"],
        "avg_response_time_ms": round(avg_response_time, 2),
        "min_response_time_ms": round(min_response_time, 2),
        "max_response_time_ms": round(max_response_time, 2),
        "total_requests": request_count,
        "total_errors": error_count,
        "error_rate_percent": round((error_count / max(request_count, 1)) * 100, 2)
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
    """Collect all web app metrics and send to Kinesis"""
    global request_count, error_count
    
    # Generate unique ID for this record
    record_id = str(uuid.uuid4())
    timestamp = int(time.time() * 1000)  # milliseconds
    
    # Check web app health
    health_check = check_webapp_health()
    request_count += 1
    
    if health_check["status"] != "online":
        error_count += 1
    
    # Collect all metrics
    metrics_data = {
        "id": record_id,
        "timestamp": timestamp,
        "type": "webapp-metrics",
        "source": WEB_APP_URL,
        "health": health_check,
        "performance": collect_performance_metrics(health_check),
        "usage": generate_simulated_metrics()
    }
    
    # Print summary
    print(f"\n{'='*70}")
    print(f"🌐 Web App Metrics Collection - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*70}")
    print(f"Status: {health_check['status'].upper()}")
    print(f"Response Time: {health_check['response_time_ms']} ms")
    print(f"Active Users: {metrics_data['usage']['active_users']}")
    print(f"Requests/sec: {metrics_data['usage']['requests_per_second']}")
    print(f"Error Rate: {metrics_data['usage']['error_rate_percent']}%")
    print(f"Avg Page Load: {metrics_data['usage']['avg_page_load_ms']} ms")
    
    # Send to Kinesis
    send_to_kinesis(metrics_data)

def main():
    """Main function"""
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║                                                                ║")
    print("║         Web Application Metrics Collector                     ║")
    print("║            Streaming to AWS Kinesis                            ║")
    print("║                                                                ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print(f"\nStream: {STREAM_NAME}")
    print(f"Region: {AWS_REGION}")
    print(f"Collection Interval: {COLLECTION_INTERVAL} seconds")
    print(f"Web App URL: {WEB_APP_URL}")
    print("\n⚠️  Note: Simulated metrics will be generated for demonstration.")
    print("   Configure your actual web app metrics collection in production.")
    print("\nPress Ctrl+C to stop...\n")
    
    try:
        while True:
            collect_and_send_metrics()
            time.sleep(COLLECTION_INTERVAL)
    except KeyboardInterrupt:
        print("\n\n✋ Stopping web app metrics collector...")
        print("Goodbye! 👋\n")

if __name__ == "__main__":
    main()

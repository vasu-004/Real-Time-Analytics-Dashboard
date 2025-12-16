
# Real-Time Analytics Dashboard Setup

This project contains a comprehensive solution for monitoring your EC2 instance and Application events in real-time using AWS Kinesis, Lambda, DynamoDB, and a custom Web Dashboard.

## Directory Structure
- `collector/`: Python scripts to run on your EC2 instance (Agent) and simulate App events.
- `dashboard/`: A modern Node.js web dashboard to visualize the data.

## Prerequisites
- AWS Credentials configured on your machine and EC2 instance (typically in `~/.aws/credentials`).
- Python 3.x installed.
- Node.js installed.

---

## Step 1: Connect Your EC2 Instance (Data Collection)
To "connect your app VM" to the dashboard, you need to run the collector agent on the VM.

1.  **Transfer the `collector` folder** to your EC2 instance.
2.  **Install Python Dependencies** on the EC2:
    ```bash
    pip install -r collector/requirements.txt
    ```
3.  **Run the Agent**:
    ```bash
    python collector/vm_agent.py
    ```
    *This script will collect CPU, Memory, and Disk usage every 5 seconds and send it to your Kinesis Data Stream.*

## Step 2: Generate Application Events (Optional/Testing)
If you don't have your application instrumented yet, you can run the simulator to see data on the dashboard.

1.  Run the simulator locally or on the VM:
    ```bash
    python collector/app_simulator.py
    ```

## Step 3: Run the Dashboard
1.  Navigate to the dashboard directory:
    ```bash
    cd dashboard
    ```
2.  Install dependencies (if not already done):
    ```bash
    npm install
    ```
3.  Start the server:
    ```bash
    npm start
    ```
4.  Open your browser and go to: `http://localhost:3000`

---

## Configuration
- **AWS Region**: Default is `ap-south-1`. If you need to change it, edit `collector/vm_agent.py`, `collector/app_simulator.py`, and `dashboard/server.js`.
- **Stream/Table Names**: Ensure they match your AWS setup (configured as `real-time-analytics-stream` and `analytics-data`).

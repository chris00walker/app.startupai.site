# Google Cloud Platform Deployment Guide

This guide will help you deploy your complete multi-agent intelligence platform using Docker Compose on Google Cloud Platform (GCP) using your $300 free credit.

## Prerequisites

1. A Google Cloud Platform account (sign up at https://cloud.google.com/free)
2. Your OpenAI API key
3. Google Cloud SDK installed locally

## Step 1: Set Up Google Cloud Account

1. Go to https://cloud.google.com/free and sign up for a new account
2. You'll get $300 in free credits valid for 90 days
3. Complete the account verification process (requires a credit card, but you won't be charged)

## Step 2: Install Google Cloud SDK

### On Linux/macOS:

```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### On Windows:

Download the installer from: https://cloud.google.com/sdk/docs/install

## Step 3: Initialize Google Cloud SDK

```bash
gcloud init
```

This will:
1. Authenticate you with your Google account
2. Allow you to select or create a project
3. Set up default region and zone

## Step 4: Create a Compute Engine Instance

For your Docker Compose setup, you'll need a VM with sufficient resources:

```bash
gcloud compute instances create multi-agent-platform \
  --zone=us-central1-a \
  --machine-type=e2-standard-2 \
  --image-family=ubuntu-2004-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=50GB \
  --scopes=default,cloud-platform
```

## Step 5: Connect to Your Instance

```bash
gcloud compute ssh multi-agent-platform --zone=us-central1-a
```

## Step 6: Install Docker and Docker Compose on the VM

Once connected to your VM:

```bash
# Update package index
sudo apt update

# Install Docker
sudo apt install docker.io -y

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add your user to the docker group
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect
exit
```

Then reconnect:

```bash
gcloud compute ssh multi-agent-platform --zone=us-central1-a
```

## Step 7: Deploy Your Application

### 7.1: Clone Your Repository

```bash
git clone https://github.com/chris00walker/multi-agent-intelligence-platform.git
cd multi-agent-intelligence-platform
```

### 7.2: Set Environment Variables

Create a `.env` file in the backend directory:

```bash
cd backend
cp .env.example .env
```

Edit the `.env` file to add your OpenAI API key:

```bash
nano .env
```

Add your OpenAI API key:
```
OPENAI_API_KEY=your_actual_openai_api_key_here
```

### 7.3: Run Your Application

```bash
cd ..
sudo docker-compose up -d
```

## Step 8: Access Your Application

### 8.1: Get Your VM's External IP

In a new terminal (not connected to the VM):

```bash
gcloud compute instances list
```

### 8.2: Configure Firewall Rules

Allow traffic to your application ports:

```bash
gcloud compute firewall-rules create allow-multi-agent \
  --allow tcp:3000,tcp:3002 \
  --description="Allow multi-agent platform ports"
```

### 8.3: Access Your Application

Open your browser and go to:
- Frontend: `http://YOUR_VM_EXTERNAL_IP:3000`
- Backend API: `http://YOUR_VM_EXTERNAL_IP:3002`

## Step 9: Testing

### 9.1: Check Application Status

```bash
gcloud compute ssh multi-agent-platform --zone=us-central1-a
sudo docker-compose ps
```

### 9.2: View Logs

```bash
sudo docker-compose logs -f
```

### 9.3: Test API Endpoints

```bash
curl http://localhost:3002/api/health
```

## Cost Management

With the $300 free credit, your application should run for the full 90 days without incurring charges. To monitor your usage:

1. Go to the GCP Console
2. Navigate to Billing
3. Set up budget alerts to avoid unexpected charges

## Troubleshooting

### Common Issues

1. **Docker Permission Denied**: Log out and back in after adding your user to the docker group
2. **Port Not Accessible**: Check firewall rules and VM external IP
3. **Insufficient Resources**: The e2-standard-2 machine type should be sufficient, but you can scale up if needed

### Getting Help

If you encounter issues:

1. Check the application logs: `sudo docker-compose logs`
2. Verify all environment variables are correctly set
3. Ensure your OpenAI API key is valid

## Next Steps

Once your application is running successfully:

1. Test all functionality through the web interface
2. Verify that all agents are working correctly
3. Check that data is being stored in MongoDB
4. Test the Milvus integration for vector operations

This deployment maintains your complete application architecture without requiring code changes, allowing you to test the full functionality of your multi-agent intelligence platform using Google Cloud's generous free credit.

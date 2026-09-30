You need to use python3 and pip3 on macOS. Run these commands:

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
If python3 is not found either, install it first:

# Install via Homebrew (recommended)

brew install python3

# Then retry

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
After source venv/bin/activate you'll see (venv) in your prompt — at that point python and pip will work without the 3 suffix.

Then install Python and start the service:

brew install python3
cd /Users/daulathussain/Documents/web3-fraud-detection/ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py

All packages installed successfully. Now start the service:

python main.py
You should see:

INFO: Loading Isolation Forest model...
INFO: Model ready.
INFO: Uvicorn running on http://0.0.0.0:8000

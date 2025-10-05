import sys
sys.path.insert(0, '.')
try:
    import src.webrtc_client as webrtc_client
    print(f"Loaded from: {webrtc_client.__file__}")
except ImportError as e:
    print(f"Failed to import: {e}")
except AttributeError:
    print("Could not find __file__ attribute.")

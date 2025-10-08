import yaml
import os

def load_config(config_path="config.yaml"):
    script_dir = os.path.dirname(__file__)
    project_root = os.path.abspath(os.path.join(script_dir, '..', '..'))
    full_config_path = os.path.join(project_root, config_path)
    try:
        with open(full_config_path, 'r') as f:
            return yaml.safe_load(f)
    except FileNotFoundError:
        print(f"Error: Config file not found at {full_config_path}")
        return None
    except yaml.YAMLError as e:
        print(f"Error parsing YAML file: {e}")
        return None

if __name__ == '__main__':
    config = load_config()
    if config:
        print("Config loaded successfully:")
        print(config)

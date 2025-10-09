# Phase 3: Envoy Proxy 설정 및 gRPC-Web 환경 구성

## 1. 배경

브라우저는 gRPC 서버와 직접 통신할 수 없으므로, gRPC-Web 프록시가 필요합니다. Envoy Proxy는 gRPC-Web 요청을 표준 gRPC 요청으로 변환하여 백엔드 gRPC 서버로 전달하는 역할을 수행합니다.

## 2. 목표

*   Envoy Proxy를 설치하고 구성하여 프론트엔드(React)와 백엔드(gRPC 서버) 간의 gRPC-Web 통신을 가능하게 합니다.
*   프론트엔드에서 `http://localhost:8080`으로 gRPC-Web 요청을 보내면, Envoy가 이를 `localhost:50051`의 백엔드 gRPC 서버로 포워딩하도록 설정합니다.

## 3. Envoy Proxy 설치 (Linux - Ubuntu/Debian 기준)

다음 명령어를 순서대로 실행하여 Envoy Proxy를 설치합니다.

```bash
# 1. Envoy GPG 키 추가
sudo apt update
sudo apt install -y apt-transport-https ca-certificates curl gnupg2
curl -sL 'https://getenvoy.io/gpg' | gpg --dearmor | sudo tee /usr/share/keyrings/getenvoy-keyring.gpg > /dev/null

# 2. Envoy 저장소 추가
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/getenvoy-keyring.gpg] https://dl.getenvoy.io/public/deb/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/getenvoy.list
sudo apt update

# 3. Envoy 설치
sudo apt install -y envoy
```

## 4. Envoy Proxy 설정 파일 (`envoy.yaml`) 생성

다음 내용을 포함하는 `envoy.yaml` 파일을 프로젝트 루트(`AI_Battle_Arena/`)에 생성합니다.

```yaml
# envoy.yaml
static_resources:
  listeners:
  - name: listener_0
    address:
      socket_address:
        address: 0.0.0.0
        port_value: 8080 # Frontend will connect to this port for gRPC-Web
    filter_chains:
    - filters:
      - name: envoy.filters.network.http_connection_manager
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
          stat_prefix: ingress_http
          codec_type: AUTO
          route_config:
            name: local_route
            virtual_hosts:
            - name: local_service
              domains: ["*"]
              routes:
              - match:
                  prefix: "/"
                route:
                  cluster: grpc_backend
                typed_per_filter_config:
                  envoy.filters.http.grpc_web: {}
          http_filters:
          - name: envoy.filters.http.grpc_web # gRPC-Web filter must be before router
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.filters.http.grpc_web.v3.GrpcWeb
          - name: envoy.filters.http.router
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
  clusters:
  - name: grpc_backend
    connect_timeout: 0.25s
    type: LOGICAL_DNS
    # Comment out the following line to test on v6.
    lb_policy: ROUND_ROBIN
    load_assignment:
      cluster_name: grpc_backend
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address:
                address: 127.0.0.1
                port_value: 50051 # Backend gRPC server port
```

## 5. Envoy Proxy 실행

`envoy.yaml` 파일을 생성한 후, 프로젝트 루트(`AI_Battle_Arena/`)에서 다음 명령어를 실행하여 Envoy Proxy를 시작합니다.

```bash
envoy -c envoy.yaml
```

## 6. 데이터 흐름 요약

1.  프론트엔드(React)는 `http://localhost:8080`으로 gRPC-Web 요청을 보냅니다.
2.  Envoy Proxy가 이 요청을 수신하여 gRPC-Web 필터를 통해 표준 gRPC 요청으로 변환합니다.
3.  변환된 gRPC 요청은 `127.0.0.1:50051`에서 실행 중인 백엔드 gRPC 서버로 전달됩니다.
4.  백엔드 gRPC 서버는 요청을 처리하고 gRPC 응답을 Envoy로 보냅니다.
5.  Envoy는 gRPC 응답을 gRPC-Web 응답으로 변환하여 프론트엔트로 전달합니다.

## 7. 향후 고려사항

*   **CORS 설정**: Envoy 설정에 CORS 정책을 추가하여 프론트엔드 도메인에서의 요청을 허용해야 할 수 있습니다.
*   **TLS/SSL**: 프로덕션 환경에서는 Envoy와 백엔드 gRPC 서버 간, 그리고 클라이언트와 Envoy 간에 TLS/SSL을 설정하여 통신을 암호화해야 합니다.
*   **로드 밸런싱**: Envoy는 강력한 로드 밸런싱 기능을 제공하므로, 필요에 따라 백엔드 gRPC 서버 인스턴스를 여러 개 두고 로드 밸런싱을 구성할 수 있습니다.

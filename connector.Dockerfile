# Local build wrapper for a from-source qurl-connector binary.
#
# Why this exists: ghcr.io/layervai/qurl-connector images stop at v0.5.0,
# which speaks the OLD HTTP bootstrap API — an endpoint the sandbox no longer
# serves (confirmed 404 on api.layerv.xyz, no bootstrap.layerv.xyz at all).
# The modern connector (main @ 77ac777, qurl-go v0.5.2) enrolls the SDK way:
# an enrollment token + the QURL_CONNECTOR_HUB_* trust triple already set in
# compose.yaml. Until upstream publishes current images, we build the binary
# from source (cross-compiled, CGO_ENABLED=0, linux/amd64) and wrap it here.
#
# This mirrors the upstream docker/Dockerfile runtime stage exactly:
# distroless static (UID 65532 nonroot, ca-certs included, no shell),
# WORKDIR /work so ./qurl-proxy.yaml config discovery works with the
# documented mount pattern.
#
# Build (from this directory, with qurl-connector-linux-amd64 present):
#   docker build -f connector.Dockerfile -t everhaven/qurl-connector:sandbox-77ac777 .
FROM gcr.io/distroless/static-debian12:nonroot@sha256:f5b485ea962d9bd1186b2f6b3a061191539b905b82ec395de78cbfae51f20e35

COPY qurl-connector-linux-amd64 /usr/local/bin/qurl-connector

WORKDIR /work

USER nonroot:nonroot

ENTRYPOINT ["/usr/local/bin/qurl-connector"]
CMD ["run"]

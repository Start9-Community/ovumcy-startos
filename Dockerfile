# Ovumcy's own image is built FROM scratch: its layers contain app/, etc/ and
# usr/ and nothing else. StartOS launches a subcontainer and waits for
# <rootfs>/proc/1 to appear, which cannot happen in a rootfs with no /proc, so
# that image fails to start with "Failed to start subcontainer ovumcy". This
# image is the upstream binary, byte for byte, on a base that has the
# directories a container runtime expects — plus a shell and coreutils, which
# is what lets the data volume be chowned and the service run unprivileged.
#
# Pinned by digest, not by tag: the bytes copied below are then exactly the
# ones from the upstream build that was tested, and no later retag can change
# them. Bump both references together — see UPDATING.md.
FROM ghcr.io/ovumcy/ovumcy-web:sha-8918dac@sha256:2f3a952e90166e8e33d00b1789d41565b648bfb7b3133b322dd26339c714bc8a AS upstream

FROM alpine:3.22

# ca-certificates for outbound webhook reminders over HTTPS; tzdata because
# cycle entries are dates and the server's day boundary follows TZ.
RUN apk add --no-cache ca-certificates tzdata \
    && addgroup -S -g 10001 ovumcy \
    && adduser -S -D -H -u 10001 -G ovumcy -h /app ovumcy \
    && mkdir -p /app/data /app/fence \
    && chown -R 10001:10001 /app

COPY --from=upstream --chown=10001:10001 /app/ovumcy /app/ovumcy

WORKDIR /app
EXPOSE 8080
USER 10001:10001
CMD ["/app/ovumcy"]

# syntax=docker/dockerfile:1
FROM alpine:3.23

RUN --mount=type=secret,id=demo_token,required=true \
    test -s /run/secrets/demo_token \
    && printf 'credential_was_available=true\n' > /proof.txt

CMD ["cat", "/proof.txt"]

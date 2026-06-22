FROM node:20-alpine

RUN apk add --no-cache git openssh bash sudo postgresql16 postgresql16-client postgresql16-contrib python3 make g++ curl

RUN echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
RUN mkdir -p /var/lib/postgresql/data /run/postgresql && \
    chown -R postgres:postgres /var/lib/postgresql /run/postgresql

USER node
WORKDIR /workspace

EXPOSE 3000 5432 8081 19000 19001 19002

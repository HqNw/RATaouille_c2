# Multi-stage build for the RAT project

###################################################
################  BACKEND STAGES  #################
###################################################

###################################################
# Stage: backend-base
###################################################
FROM python:3.13-slim AS backend-base
WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
EXPOSE 5000
CMD ["python", "main.py"]


###################################################
################  FRONTEND STAGES  ################
###################################################

###################################################
# Stage: frontend-base
###################################################
FROM node AS frontend-base
WORKDIR /app/client
COPY frontend/package.json frontend/package-lock.json ./
RUN --mount=type=cache,id=npm,target=/root/.npm npm ci


###################################################
# Stage: frontend-dev
###################################################
FROM frontend-base AS frontend-dev
EXPOSE 5173
CMD ["npm", "run", "dev"]


###################################################
# Stage: frontend-final
###################################################
FROM frontend-base AS frontend-final
COPY frontend/index.html frontend/vite.config.ts frontend/tsconfig.json frontend/tailwind.config.js frontend/tsconfig.app.json frontend/tsconfig.node.json frontend/tsconfig.json ./
COPY frontend/public ./public
COPY frontend/src ./src

RUN npm run build

###################################################
################  C2SERVER STAGES  ################
###################################################

###################################################
# Stage: c2server-base
###################################################

FROM rust AS c2-server-base
WORKDIR /app/c2_server
COPY rat_c2_server/Cargo.toml rat_c2_server/Cargo.lock ./
RUN mkdir -p src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -f src/main.rs target/release/deps/rat_c2_server*
RUN mkdir -p /app/c2_server/dowmloads
RUN touch /app/c2_server/rats.db

###################################################
# Stage: c2server-dev-intermediate
###################################################

FROM c2-server-base AS c2server-dev-intermediate
RUN cargo install cargo-watch


###################################################
# Stage: c2server-dev
###################################################


FROM c2server-dev-intermediate AS c2server-dev

COPY rat_c2_server/src ./src
EXPOSE 9001
EXPOSE 9002
CMD ["cargo", "watch", "-c", "-w", "src", "--", "cargo", "run"]


###################################################
# Stage: c2server-final
###################################################

FROM c2-server-base AS c2server-final

COPY rat_c2_server/src ./src
RUN cargo build --release
COPY --from=c2-server-base /app/target/release/rat_c2_server ./target/release/rat_c2_server
EXPOSE 9001
EXPOSE 9002
CMD ["./target/release/rat_c2_server"]


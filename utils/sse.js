let clients = [];

export const registerStream = (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  res.write("\n");
  clients.push(res);

  // Keep-alive heartbeat every 20 seconds
  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 20000);

  req.on("close", () => {
    clearInterval(heartbeat);
    clients = clients.filter((client) => client !== res);
  });
};

export const broadcastNewUser = (user) => {
  const data = JSON.stringify({
    _id: user._id,
    name: user.name,
    role: user.role,
    location: user.location,
  });

  clients.forEach((client) => {
    try {
      client.write(`data: ${data}\n\n`);
    } catch (err) {
      console.error("Failed to write to SSE client:", err.message);
    }
  });
};

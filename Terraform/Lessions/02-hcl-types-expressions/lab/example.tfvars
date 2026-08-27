environment = "dev"

services = [
  {
    name  = "web"
    ports = [80, 443]
    metadata = {
      owner = "team-web"
      tier  = "public"
    }
  },
  {
    name    = "worker"
    enabled = true
    ports   = [8080]
  }
]


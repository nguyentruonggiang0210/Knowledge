workloads = {
  edge = {
    role          = "edge"
    public        = true
    ingress_cidrs = ["0.0.0.0/0"]
    encrypted     = true
    owner         = "platform"
  }
  database = {
    role          = "data"
    public        = false
    ingress_cidrs = ["10.20.20.0/24"]
    encrypted     = true
    owner         = "data-team"
  }
}


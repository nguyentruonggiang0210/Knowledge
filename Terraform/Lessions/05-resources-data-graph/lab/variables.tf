variable "release" {
  description = "Phiên bản giả lập dùng để kích hoạt immutable replacement."
  type        = string
  default     = "1.0.0"
}

variable "services" {
  type = map(object({
    port     = number
    replicas = number
  }))

  default = {
    api = {
      port     = 8080
      replicas = 2
    }
    worker = {
      port     = 9090
      replicas = 1
    }
  }
}


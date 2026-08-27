variable "environment" {
  type    = string
  default = "dev"
}

variable "services" {
  description = "Service contract dùng để luyện object/list/optional."
  type = list(object({
    name    = string
    enabled = optional(bool, true)
    ports   = set(number)
    metadata = optional(object({
      owner = optional(string, "platform")
      tier  = optional(string, "internal")
    }), {})
  }))

  validation {
    condition = alltrue(flatten([
      for service in var.services : [
        for port in service.ports : port >= 1 && port <= 65535
      ]
    ]))
    error_message = "Mọi port phải nằm trong khoảng 1..65535."
  }

  validation {
    condition     = length(distinct([for service in var.services : service.name])) == length(var.services)
    error_message = "Tên service phải duy nhất để làm stable key."
  }
}


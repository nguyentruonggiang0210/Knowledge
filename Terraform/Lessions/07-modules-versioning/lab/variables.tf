variable "environment" {
  type    = string
  default = "dev"
}

variable "components" {
  type = map(object({
    owner = string
  }))
  default = {
    api = {
      owner = "payments-team"
    }
    web = {
      owner = "experience-team"
    }
  }
}


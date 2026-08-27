variable "environment" {
  description = "Tên môi trường chuẩn hóa."
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment phải là dev, staging hoặc prod."
  }
}

variable "application" {
  description = "Contract của application."
  type = object({
    name           = string
    instance_count = optional(number, 1)
    public         = optional(bool, false)
    owner          = string
  })

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,29}$", var.application.name))
    error_message = "application.name dài 3..30, bắt đầu bằng chữ thường và chỉ gồm a-z, 0-9, dấu gạch."
  }

  validation {
    condition     = var.application.instance_count >= 1 && var.application.instance_count <= 10
    error_message = "instance_count phải trong khoảng 1..10."
  }
}


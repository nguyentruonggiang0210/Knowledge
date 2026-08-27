variable "aws_region" {
  description = "AWS Region triển khai lab."
  type        = string
  default     = "ap-southeast-1"

  validation {
    condition     = can(regex("^[a-z]{2}(-[a-z]+)+-[0-9]+$", var.aws_region))
    error_message = "aws_region phải có dạng AWS Region hợp lệ, ví dụ ap-southeast-1."
  }
}

variable "project_name" {
  description = "Tên ngắn dùng làm prefix/tag; chữ thường, số và dấu gạch ngang."
  type        = string
  default     = "tf-oci-bridge"

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]{1,22}[a-z0-9]$", var.project_name))
    error_message = "project_name phải dài 3-24 ký tự, chỉ gồm chữ thường, số, dấu gạch ngang và không bắt đầu/kết thúc bằng dấu gạch ngang."
  }
}

variable "environment" {
  description = "Tên môi trường."
  type        = string
  default     = "lab"

  validation {
    condition     = contains(["lab", "dev", "test", "staging", "prod"], var.environment)
    error_message = "environment phải là lab, dev, test, staging hoặc prod."
  }
}

variable "vpc_cidr" {
  description = "IPv4 CIDR cho VPC."
  type        = string
  default     = "10.20.0.0/16"

  validation {
    condition     = can(cidrnetmask(var.vpc_cidr))
    error_message = "vpc_cidr phải là IPv4 CIDR hợp lệ."
  }
}

variable "public_subnet_cidr" {
  description = "IPv4 CIDR cho public subnet; phải nằm trong vpc_cidr."
  type        = string
  default     = "10.20.1.0/24"

  validation {
    condition     = can(cidrnetmask(var.public_subnet_cidr))
    error_message = "public_subnet_cidr phải là IPv4 CIDR hợp lệ."
  }
}

variable "create_compute" {
  description = "Bật để tạo EC2 và public IPv4 có tính phí. Mặc định false để lab network-only."
  type        = bool
  default     = false
}

variable "instance_type" {
  description = "EC2 instance type khi create_compute=true; kiểm tra availability và giá tại region đã chọn."
  type        = string
  default     = "t3.micro"
}

variable "allowed_http_cidr" {
  description = "CIDR được phép truy cập HTTP port 80 khi tạo compute. Lab mặc định public; production phải giới hạn/đặt sau LB/WAF."
  type        = string
  default     = "0.0.0.0/0"

  validation {
    condition     = can(cidrnetmask(var.allowed_http_cidr))
    error_message = "allowed_http_cidr phải là IPv4 CIDR hợp lệ."
  }
}

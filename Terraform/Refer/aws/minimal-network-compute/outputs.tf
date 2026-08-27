output "execution_context" {
  description = "Context để đối chiếu trước khi apply."
  value = {
    region            = var.aws_region
    availability_zone = aws_subnet.public.availability_zone
    create_compute    = var.create_compute
  }
}

output "vpc_id" {
  description = "ID của VPC."
  value       = aws_vpc.main.id
}

output "public_subnet_id" {
  description = "ID của public subnet."
  value       = aws_subnet.public.id
}

output "instance_id" {
  description = "EC2 instance ID hoặc null khi create_compute=false."
  value       = try(aws_instance.web[0].id, null)
}

output "public_url" {
  description = "HTTP URL hoặc null khi create_compute=false. Chờ cloud-init hoàn tất trước khi truy cập."
  value       = try("http://${aws_instance.web[0].public_ip}", null)
}

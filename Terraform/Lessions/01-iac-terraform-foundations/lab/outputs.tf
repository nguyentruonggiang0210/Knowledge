output "lesson_result" {
  description = "Dữ liệu được resource lưu vào state."
  value       = terraform_data.first_resource.output
}


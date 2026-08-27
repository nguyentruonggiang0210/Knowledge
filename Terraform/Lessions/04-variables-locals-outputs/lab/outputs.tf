output "application_summary" {
  description = "Chỉ expose contract cần cho consumer, không output cả resource."
  value = {
    name           = terraform_data.application_contract.output.name
    instance_count = terraform_data.application_contract.output.instance_count
    tags           = terraform_data.application_contract.output.tags
  }
}


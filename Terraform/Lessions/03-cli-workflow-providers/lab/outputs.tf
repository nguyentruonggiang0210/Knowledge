output "availability_domain_names" {
  description = "Danh sách AD nhìn thấy từ compartment."
  value       = [for ad in data.oci_identity_availability_domains.current.availability_domains : ad.name]
}


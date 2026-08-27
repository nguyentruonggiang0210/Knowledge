# Nguồn chính thức và cách cập nhật

Cloud, Kubernetes, security và observability thay đổi liên tục. Các lesson dạy nguyên lý và
ghi nguồn để kiểm API/version hiện hành trước khi chạy. Danh sách được rà soát ngày
2026-08-28; “latest” không phải version pin.

## Culture, flow và delivery

- [DORA capabilities](https://dora.dev/capabilities/)
- [DORA software delivery metrics](https://dora.dev/guides/dora-metrics/)
- [Scrum Guide](https://scrumguides.org/scrum-guide.html)
- [Git book](https://git-scm.com/book/en/v2)
- [Git reference](https://git-scm.com/docs)

## Linux, shell và networking

- [Linux kernel admin guide](https://www.kernel.org/doc/html/latest/admin-guide/)
- [systemd manuals](https://www.freedesktop.org/software/systemd/man/latest/)
- [GNU Bash manual](https://www.gnu.org/software/bash/manual/)
- [PowerShell documentation](https://learn.microsoft.com/powershell/)
- [Python documentation](https://docs.python.org/3/)
- [RFC 8200 - IPv6](https://www.rfc-editor.org/rfc/rfc8200)
- [RFC 1034 - DNS concepts](https://www.rfc-editor.org/rfc/rfc1034)
- [RFC 9110 - HTTP semantics](https://www.rfc-editor.org/rfc/rfc9110)
- [RFC 8446 - TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446)

## Cloud, IaC, config và images

- [OCI documentation](https://docs.oracle.com/en-us/iaas/Content/home.htm)
- [OCI Cloud Adoption Framework](https://docs.oracle.com/en-us/iaas/Content/cloud-adoption-framework/home.htm)
- [Terraform language](https://developer.hashicorp.com/terraform/language)
- [Terraform CLI](https://developer.hashicorp.com/terraform/cli)
- [OCI Terraform provider](https://registry.terraform.io/providers/oracle/oci/latest/docs)
- [Packer documentation](https://developer.hashicorp.com/packer/docs)
- [Ansible documentation](https://docs.ansible.com/projects/ansible/latest/)
- [cloud-init documentation](https://cloudinit.readthedocs.io/)
- [Repository Terraform/OCI lessons](../Lessions/README.md)
- [Repository OCI/AWS/Azure reference](../Refer/README.md)

## Containers, Kubernetes và GitOps

- [Open Container Initiative specifications](https://specs.opencontainers.org/)
- [Docker documentation](https://docs.docker.com/)
- [Kubernetes concepts](https://kubernetes.io/docs/concepts/)
- [Kubernetes production environment](https://kubernetes.io/docs/setup/production-environment/)
- [Kubernetes version skew policy](https://kubernetes.io/releases/version-skew-policy/)
- [Helm documentation](https://helm.sh/docs/)
- [Kustomize documentation](https://kubectl.docs.kubernetes.io/references/kustomize/)
- [OpenGitOps principles](https://opengitops.dev/)
- [Argo CD documentation](https://argo-cd.readthedocs.io/en/stable/)
- [Flux documentation](https://fluxcd.io/flux/)

## Security và supply chain

- [NIST Secure Software Development Framework SP 800-218](https://csrc.nist.gov/pubs/sp/800/218/final)
- [NIST Cybersecurity Framework 2.0](https://www.nist.gov/cyberframework)
- [SLSA specification 1.2](https://slsa.dev/spec/v1.2/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP threat modeling](https://owasp.org/www-community/Threat_Modeling)
- [Kubernetes security](https://kubernetes.io/docs/concepts/security/)
- [Sigstore documentation](https://docs.sigstore.dev/)
- [CycloneDX specification](https://cyclonedx.org/specification/overview/)
- [SPDX specification](https://spdx.dev/use/specifications/)

## Observability và SRE

- [OpenTelemetry concepts](https://opentelemetry.io/docs/concepts/)
- [OpenTelemetry signals](https://opentelemetry.io/docs/concepts/signals/)
- [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/)
- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
- [Prometheus documentation](https://prometheus.io/docs/)
- [Google Site Reliability Engineering book](https://sre.google/sre-book/table-of-contents/)
- [Google SRE Workbook](https://sre.google/workbook/table-of-contents/)
- [OpenSLO specification](https://openslo.com/)

## Data và messaging

- [PostgreSQL current documentation](https://www.postgresql.org/docs/current/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [CloudEvents specification](https://cloudevents.io/)
- [Redis documentation](https://redis.io/docs/latest/)

## Platform, FinOps và operations

- [CNCF Platforms White Paper](https://tag-app-delivery.cncf.io/whitepapers/platforms/)
- [Backstage documentation](https://backstage.io/docs/)
- [FinOps Framework](https://www.finops.org/framework/)
- [Green Software Foundation](https://greensoftware.foundation/)
- [NIST Incident Response SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final)
- [NIST Contingency Planning SP 800-34](https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final)
- [OCI resilient topology guidance](https://docs.oracle.com/en/solutions/oci-best-practices/reliable-and-resilient-cloud-topology-practices1.html)

## Cách dùng nguồn an toàn

1. Đọc concept/architecture trước quickstart.
2. Chọn exact product/version; kiểm deprecation/version skew/release note.
3. Pin version/digest/checksum trong lab/pipeline.
4. Test sandbox với data giả, quota/budget/TTL và cleanup.
5. Ghi ngày/version/assumption trong ADR/runbook.
6. Khi nguồn thứ cấp mâu thuẫn, ưu tiên specification/vendor docs và test behavior.

Nguồn chính thức vẫn có thể có bug hoặc thiếu context. Production decision cần prototype,
threat/failure/cost model và evidence từ environment của bạn.

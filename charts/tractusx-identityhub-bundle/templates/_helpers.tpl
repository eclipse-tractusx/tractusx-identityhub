{{/*
Expand the name of the chart.
*/}}
{{- define "identityhub.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "identityhub.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{- define "identityhub.fullname.backend" -}}
{{- if .Values.backend.name }}
{{- .Values.backend.name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-backend" (include "identityhub.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/*
Fully qualified frontend name, release-name prefixed to mirror the backend subchart
(e.g. release "consumer1" + nameOverride "identityhub-frontend" -> "consumer1-identityhub-frontend",
matching the backend's "consumer1-identityhub-backend").
*/}}
{{- define "identityhub.fullname.frontend" -}}
{{- if .Values.frontend.fullnameOverride }}
{{- .Values.frontend.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.frontend.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "identityhub.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels (no selector labels; those are added per-component to avoid
overwriting the component-specific app.kubernetes.io/name)
*/}}
{{- define "identityhub.labels" -}}
helm.sh/chart: {{ include "identityhub.chart" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Backend labels (includes backend selector labels)
*/}}
{{- define "identityhub.backend.labels" -}}
{{ include "identityhub.backend.selectorLabels" . }}
{{ include "identityhub.labels" . }}
{{- end }}

{{/*
Frontend labels (includes frontend selector labels)
*/}}
{{- define "identityhub.frontend.labels" -}}
{{ include "identityhub.frontend.selectorLabels" . }}
{{ include "identityhub.labels" . }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "identityhub.selectorLabels" -}}
app.kubernetes.io/name: {{ include "identityhub.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Frontend Selector labels
*/}}
{{- define "identityhub.backend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "identityhub.fullname.backend" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Backend Selector labels
*/}}
{{- define "identityhub.frontend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "identityhub.fullname.frontend" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the backend service account to use
*/}}
{{- define "identityhub.serviceAccountName.backend" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "identityhub.fullname.backend" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create the name of the frontend service account to use.
NOTE: this is deliberately suffixed with ".frontend" so it does NOT collide with the
`identityhub.serviceAccountName` template defined by the tractusx-identityhub subchart.
Helm templates share a single global namespace, and a parent definition would otherwise
shadow the subchart's and be evaluated in the subchart's (frontend-less) context.
*/}}
{{- define "identityhub.serviceAccountName.frontend" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "identityhub.fullname.frontend" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
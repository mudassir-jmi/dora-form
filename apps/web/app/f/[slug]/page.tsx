"use client";

import { useParams } from "next/navigation";

import { PublicFormClient } from "~/components/forms/public-form-client";

export default function PublicFormPage() {
  const params = useParams<{ slug: string }>();

  return <PublicFormClient slug={params.slug} />;
}

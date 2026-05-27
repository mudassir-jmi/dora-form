import { FormBuilderConsole } from "~/components/forms/form-builder-console";

interface FormPageProps {
  params: Promise<{ id: string }>;
}

export default async function FormPage({ params }: FormPageProps) {
  const { id } = await params;

  return <FormBuilderConsole formId={id} />;
}

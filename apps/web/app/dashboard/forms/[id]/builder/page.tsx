import { FormBuilderConsole } from "~/components/forms/form-builder-console";

export default async function FormBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <FormBuilderConsole formId={id} />;
}

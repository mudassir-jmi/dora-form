import { FormAnalyticsConsole } from "~/components/forms/form-analytics-console";

export default async function FormAnalyticsPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;

  return <FormAnalyticsConsole formId={formId} />;
}

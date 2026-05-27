import { FormAnalyticsConsole } from "~/components/forms/form-analytics-console";

interface FormAnalyticsPageProps {
  params: Promise<{ id: string }>;
}

export default async function FormAnalyticsPage({ params }: FormAnalyticsPageProps) {
  const { id } = await params;

  return <FormAnalyticsConsole formId={id} />;
}

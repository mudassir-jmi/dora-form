import type { RouterInputs } from "@repo/trpc/client";
import { trpc } from "~/trpc/client";

export const useMyForms = (input?: RouterInputs["form"]["listMine"]) => {
  const query = trpc.form.listMine.useQuery(input);

  return {
    forms: query.data ?? [],
    ...query,
  };
};

export const useDashboardActivity = (input?: RouterInputs["form"]["dashboardActivity"]) => {
  const query = trpc.form.dashboardActivity.useQuery(input);

  return {
    activity: query.data ?? [],
    ...query,
  };
};

export const useForm = (id: string, enabled = true) => {
  const query = trpc.form.getMineById.useQuery({ id }, { enabled: Boolean(id) && enabled });

  return {
    form: query.data,
    ...query,
  };
};

export const useCreateForm = () => {
  const utils = trpc.useUtils();

  return trpc.form.create.useMutation({
    onSuccess: async () => {
      await utils.form.listMine.invalidate();
    },
  });
};

export const useUpdateForm = () => {
  const utils = trpc.useUtils();

  return trpc.form.update.useMutation({
    onSuccess: async (form) => {
      await Promise.all([
        utils.form.listMine.invalidate(),
        utils.form.getMineById.invalidate({ id: form.id }),
      ]);
    },
  });
};

export const usePublishForm = () => {
  const utils = trpc.useUtils();

  return trpc.form.publish.useMutation({
    onSuccess: async (form) => {
      await Promise.all([
        utils.form.listMine.invalidate(),
        utils.form.getMineById.invalidate({ id: form.id }),
        utils.form.explorePublic.invalidate(),
      ]);
    },
  });
};

export const useUnpublishForm = () => {
  const utils = trpc.useUtils();

  return trpc.form.unpublish.useMutation({
    onSuccess: async (form) => {
      await Promise.all([
        utils.form.listMine.invalidate(),
        utils.form.getMineById.invalidate({ id: form.id }),
        utils.form.explorePublic.invalidate(),
      ]);
    },
  });
};

export const useArchiveForm = () => {
  const utils = trpc.useUtils();

  return trpc.form.archive.useMutation({
    onSuccess: async (form) => {
      await Promise.all([
        utils.form.listMine.invalidate(),
        utils.form.getMineById.invalidate({ id: form.id }),
        utils.form.explorePublic.invalidate(),
      ]);
    },
  });
};

export const useCreateField = () => {
  const utils = trpc.useUtils();

  return trpc.form.createField.useMutation({
    onSuccess: async (field) => {
      await utils.form.getMineById.invalidate({ id: field.formId });
    },
  });
};

export const useUpdateField = () => {
  const utils = trpc.useUtils();

  return trpc.form.updateField.useMutation({
    onSuccess: async (field) => {
      await utils.form.getMineById.invalidate({ id: field.formId });
    },
  });
};

export const useDeleteField = () => {
  const utils = trpc.useUtils();

  return trpc.form.deleteField.useMutation({
    onSuccess: async (field) => {
      await utils.form.getMineById.invalidate({ id: field.formId });
    },
  });
};

export const useReorderFields = () => {
  const utils = trpc.useUtils();

  return trpc.form.reorderFields.useMutation({
    onSuccess: async (form) => {
      await utils.form.getMineById.invalidate({ id: form.id });
    },
  });
};

export const usePublicForm = (slug: string, enabled = true) => {
  const query = trpc.form.getPublicBySlug.useQuery(
    { slug },
    { enabled: Boolean(slug) && enabled, retry: false },
  );

  return {
    form: query.data,
    ...query,
  };
};

export const useExploreForms = (input?: RouterInputs["form"]["explorePublic"]) => {
  const query = trpc.form.explorePublic.useQuery(input);

  return {
    forms: query.data ?? [],
    ...query,
  };
};

export const useSubmitForm = () => trpc.form.submitPublic.useMutation();

export const useSignFileUpload = () => trpc.form.signFileUpload.useMutation();

export const useFormResponses = (input: RouterInputs["form"]["listResponses"], enabled = true) => {
  const query = trpc.form.listResponses.useQuery(input, {
    enabled: Boolean(input.formId) && enabled,
  });

  return {
    responses: query.data ?? [],
    ...query,
  };
};

export const useFormAnalytics = (formId: string, enabled = true) => {
  const query = trpc.form.analytics.useQuery({ formId }, { enabled: Boolean(formId) && enabled });

  return {
    analytics: query.data,
    ...query,
  };
};

export const useSeedMissions = () => {
  const utils = trpc.useUtils();

  return trpc.form.seedMissions.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.form.listMine.invalidate(),
        utils.form.explorePublic.invalidate(),
      ]);
    },
  });
};

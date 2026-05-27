import { trpc } from "~/trpc/client"

export const useSignup = () => {
    const utils = trpc.useUtils()
    const {
        mutateAsync: createUserWithEmailAndPasswordAsync,
        mutate: createUserWithEmailAndPassword,
        error,
        failureCount,
        isError,
        isIdle,
        isSuccess,
        status

    } = trpc.auth.createUserWithEmailAndPassword.useMutation(
        {
            onSuccess: async () => {
                await utils.auth.getLoggedInUserInfo.invalidate()
            }
        }
    )
    return {
        createUserWithEmailAndPasswordAsync,
        createUserWithEmailAndPassword,
        error,
        failureCount,
        isError,
        isIdle,
        isSuccess,
        status
    }
}


export const useSignin = () => {
    const utils = trpc.useUtils()
    const {
        mutateAsync: signInUserWithEmailAndPasswordAsync,
        mutate: signInUserWithEmailAndPassword,
        error,
        failureCount,
        isError,
        isIdle,
        isSuccess,
        status

    } = trpc.auth.signInUserWithEmailAndPassword.useMutation(
        {
            onSuccess: async () => {
                await utils.auth.getLoggedInUserInfo.invalidate()
            }
        }
    )
    return {
        signInUserWithEmailAndPasswordAsync,
        signInUserWithEmailAndPassword,
        error,
        failureCount,
        isError,
        isIdle,
        isSuccess,
        status
    }
}


export const useUser = () => {
    const { data: user, error, isFetching, isFetched, status, isLoading } = trpc.auth.getLoggedInUserInfo.useQuery()
    return { user, error, isFetching, isFetched, status, isLoading }
}

export const useSignout = (options?: { onSuccess?: () => void }) => {
    const utils = trpc.useUtils()
    const {
        mutateAsync: signOutAsync,
        mutate: signOut,
        error,
        status
    } = trpc.auth.signOut.useMutation({
        onSuccess: async () => {
            await utils.auth.getLoggedInUserInfo.invalidate()
            if (options?.onSuccess) {
                options.onSuccess()
            }
        }
    })
    return {
        signOutAsync,
        signOut,
        error,
        status
    }
}

export const useVerifyEmail = () => {
    const utils = trpc.useUtils()
    return trpc.auth.verifyEmail.useMutation({
        onSuccess: async () => {
            await utils.auth.getLoggedInUserInfo.invalidate()
        }
    })
}

export const useRequestPasswordReset = () => {
    return trpc.auth.requestPasswordReset.useMutation()
}

export const useResetPassword = () => {
    return trpc.auth.resetPassword.useMutation()
}

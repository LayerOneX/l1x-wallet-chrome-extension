interface ITermsAndConditionsProps {
    form: IAccountCreationForm,
    setForm: React.Dispatch<React.SetStateAction<IAccountCreationForm>>,
    importWallet: () => void
}
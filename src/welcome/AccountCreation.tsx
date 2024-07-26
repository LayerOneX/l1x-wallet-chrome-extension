import { useState } from "react";
import SecretPhrase from "./secret_phrase/SecretPhrase";
import TermsAndConditions from "./terms_conditions/TermsAndConditions";
import VerifySecretPhrase from "./secret_phrase/VerifySecretPhrase";
import ImportWallet from "./import_wallet";

const AccountCreation = () => {
  const phraseLength = import.meta.env.VITE_SECRETE_PHASE_LENGTH || 12;
  const [importWallet, setImportWallet] = useState(false);
  const [form, setForm] = useState<IAccountCreationForm>({
    termsAccepted: false,
    secretPhrase: [],
    secretPhraseToVerify: []
  });

  switch (true) {
    case importWallet:
      return <ImportWallet navigateBack={() => setImportWallet(false)}/>
      
    case !form.termsAccepted:
      return <TermsAndConditions form={form} setForm={setForm} importWallet={() => setImportWallet(true)} />;

    case form.secretPhrase.length < phraseLength:
      return <SecretPhrase form={form} setForm={setForm} importWallet={() => setImportWallet(true)} />;
  
    default:
      return <VerifySecretPhrase form={form} setForm={setForm} importWallet={() => setImportWallet(true)} />;
  }
};

export default AccountCreation;

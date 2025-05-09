import { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { registerUser, verifyCodeAndRegister } from "@/services/auth";

export default function Register() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState<'email' | 'verification'>('email');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      const savedEmail = localStorage.getItem('register_email');
      if (savedEmail) setEmail(savedEmail);
    }
  }, []);

  useEffect(() => {
    if (step === 'verification') {
      if (!email) {
        setStep('email');
        toast.error('Por favor, preencha o registro novamente.');
        localStorage.removeItem('register_email');
      } else {
        localStorage.setItem('register_email', email);
      }
    } else {
      localStorage.removeItem('register_email');
    }
  }, [step, email]);

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await registerUser(email, password, name);
      setStep('verification');
      toast.success("Código de verificação enviado para seu email");
      localStorage.setItem('register_email', email);
    } catch (error: any) {
      toast.error(error.message || "Erro ao registrar");
      setStep('email');
      localStorage.removeItem('register_email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { user, token } = await verifyCodeAndRegister(email, verificationCode);
      toast.success("Conta criada e login efetuado com sucesso!");
      localStorage.removeItem('register_email');
      localStorage.setItem('token', token);
      localStorage.setItem('robbialac_user', JSON.stringify(user));
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Erro ao verificar código");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary to-secondary p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
        <div className="text-center">
          <img src="/lovable-uploads/6e68a784-6498-4199-a8ef-936b67038a4b.png" alt="Logo Robbialac" className="w-32 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'email' ? t('register_title') : t('verification_title')}
          </h1>
          <p className="text-gray-600">
            {step === 'email' 
              ? t('register_subtitle')
              : t('verification_subtitle')}
          </p>
        </div>

        {step === 'email' ? (
          <form className="space-y-4" onSubmit={handleEmailSubmit}>
            <div>
              <Label htmlFor="name">{t('full_name')}</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('full_name_placeholder')}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('register_button')}</>
              ) : (
                t('register_button')
              )}
            </Button>
          </form>
        ) : email ? (
          <form className="space-y-4" onSubmit={handleVerificationSubmit}>
            <div className="space-y-2">
              <Label>{t('verification_code')}</Label>
              {console.log('verificationCode', verificationCode)}
              <InputOTP
                maxLength={6}
                value={verificationCode || ''}
                onChange={(value) => setVerificationCode(value || '')}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('verification_button')}</>
              ) : (
                t('verification_button')
              )}
            </Button>
          </form>
        ) : null}

        <p className="text-sm text-center text-gray-600">
          {t('already_have_account')}{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t('login_link')}
          </Link>
        </p>
      </div>
    </div>
  );
} 
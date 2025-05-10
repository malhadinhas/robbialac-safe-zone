import { useState, FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslation } from 'react-i18next'; // Importar useTranslation

// Componentes simples para bandeiras (podem ser substituídos por SVGs/imagens)
const FlagIcon = ({ lang }: { lang: string }) => {
  const styles = "w-6 h-4 cursor-pointer rounded-sm shadow";
  if (lang === 'pt') return <div className={`${styles} bg-[#006233] relative`}><div className="absolute top-0 left-1/3 w-1/3 h-full bg-[#ff0000]"></div></div>;
  if (lang === 'en') return <div className={`${styles} bg-[#00247d] relative`}><div className="absolute w-full h-1/3 top-1/3 bg-white"><div className="h-full w-full bg-[#cf142b]"></div></div><svg className="absolute text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10 1l1.4 4.3h4.5l-3.6 2.7 1.4 4.3L10 9.6l-3.7 2.7 1.4-4.3L4.1 5.3h4.5L10 1z" clipRule="evenodd" fillRule="evenodd"/></svg></div>; // Simplificação da Union Jack
  if (lang === 'fr') return <div className={`${styles} flex`}><div className="w-1/3 h-full bg-[#0055a4]"/><div className="w-1/3 h-full bg-white"/><div className="w-1/3 h-full bg-[#ef4135]"/></div>;
  return null;
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(); // Usar hook i18n
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success(t('login_success'));
      navigate("/");
    } catch (error: any) {
      toast.error(t('login_failed'), {
        description: error?.message || t('check_credentials'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary to-secondary p-4">
       {/* Language Selector */} 
       <div className="absolute top-4 right-4 flex space-x-2">
         <button onClick={() => changeLanguage('pt')} aria-label="Mudar para Português">
           <FlagIcon lang="pt" />
         </button>
         <button onClick={() => changeLanguage('en')} aria-label="Switch to English">
           <FlagIcon lang="en" />
         </button>
         <button onClick={() => changeLanguage('fr')} aria-label="Passer au Français">
           <FlagIcon lang="fr" />
         </button>
       </div>

      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
        <div className="text-center">
          {/* Idealmente, usar um componente Logo aqui */}
          <img src="/lovable-uploads/6e68a784-6498-4199-a8ef-936b67038a4b.png" alt="Logo Robbialac" className="w-32 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">{t('login_title')}</h1>
          <p className="text-gray-600">{t('login_subtitle')}</p>
        </div>
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
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
          </div>
          {/* <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-primary hover:underline">
                Esqueceu-se da palavra-passe?
              </Link>
            </div>
          </div> */} 
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('logging_in')}</>
            ) : (
              t('login_button')
            )}
          </Button>
        </form>
        <p className="text-sm text-center text-gray-600">
          Não tem conta?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Registe-se
          </Link>
        </p>
      </div>
    </div>
  );
}

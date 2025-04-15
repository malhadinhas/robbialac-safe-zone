import { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls as DreiOrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useNavigationType, useLocation } from 'react-router-dom';

// Componente que embrulha o OrbitControls do drei
// com gestão aprimorada do ciclo de vida e detecção de problemas de navegação
export const CustomOrbitControls = (props: any) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera, gl, get, set } = useThree();
  const [isMounted, setIsMounted] = useState(false);
  const navigationType = useNavigationType();
  const location = useLocation();
  
  // Flag para controlar se o componente está em um estado seguro para interações
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Detectar se estamos atualmente navegando de volta
  const isNavigatingBack = navigationType === 'POP';

  // Quando o componente for montado
  useEffect(() => {
    console.log('CustomOrbitControls: Montando componente');
    setIsMounted(true);
    
    // Timeout para garantir que o DOM esteja pronto
    const initTimeout = setTimeout(() => {
      setIsInitialized(true);
    }, 100);
    
    // Cleanup ao desmontar
    return () => {
      console.log('CustomOrbitControls: Desmontando componente');
      setIsMounted(false);
      setIsInitialized(false);
      clearTimeout(initTimeout);
      
      try {
        // Tentar limpar manualmente
        if (controlsRef.current) {
          console.log('CustomOrbitControls: Removendo manualmente listeners de eventos');
          
          // Remover diretamente eventos do DOM
          const canvas = gl.domElement;
          
          // Lista de eventos potenciais para remover
          const events = [
            'contextmenu', 'mousedown', 'mousemove', 'mouseup', 'wheel',
            'touchstart', 'touchend', 'touchmove'
          ];
          
          // Remover todos os event listeners do canvas
          // Note: Isto é uma abordagem genérica que remove TODOS os listeners
          // o que pode interferir com outros componentes
          if (canvas && typeof canvas.removeEventListener === 'function') {
            events.forEach(event => {
              canvas.removeEventListener(event, () => {}, false);
            });
            
            // Remover eventos do documento também
            events.forEach(event => {
              document.removeEventListener(event, () => {}, false);
            });
          }
          
          // Chamar dispose explicitamente
          controlsRef.current.dispose();
          
          // Limpar os objectos internos
          controlsRef.current = null;
        }
      } catch (e) {
        console.error('CustomOrbitControls: Erro durante limpeza:', e);
      }
    };
  }, [gl]);
  
  // Se estamos voltando para esta página depois de navegar para longe,
  // adicionamos uma chave única para forçar recriação completa
  const key = isNavigatingBack ? 'navigating-back-' + location.pathname : 'normal';
  
  if (!isMounted) {
    return null;
  }
  
  // Só renderizar os controles se estiver inicializado
  return isInitialized ? (
    <DreiOrbitControls
      ref={controlsRef}
      key={key} // Forçar recriação ao voltar
      args={[camera, gl.domElement]} // Passar explicitamente os argumentos
      {...props}
    />
  ) : null;
};

export default CustomOrbitControls; 
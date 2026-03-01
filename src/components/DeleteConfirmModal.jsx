import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, isInstallment }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Overlay escuro */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" 
            onClick={onClose} 
          />
          
          {/* Caixa do Modal */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.95, opacity: 0 }} 
            className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-sm relative z-10 shadow-2xl text-center"
          >
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Excluir transação?</h3>
            
            {/* TEXTO CONDICIONAL: Explica a situação baseada se é ou não parcela */}
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              {isInstallment 
                ? "Esta despesa faz parte de uma compra parcelada. Você deseja apagar APENAS o registro deste mês ou TODAS as parcelas deste conjunto?" 
                : "Tem certeza que deseja remover esta transação? O saldo da sua conta será ajustado automaticamente."}
            </p>

            <div className="flex flex-col gap-3">
              {/* BOTÕES CONDICIONAIS */}
              {isInstallment ? (
                <>
                  {/* Botão que passa 'true' para a função deleteTransaction(tx, deleteAll) */}
                  <Button 
                    onClick={() => onConfirm(true)} 
                    className="bg-red-600 hover:bg-red-700 text-white border-none py-3.5 rounded-2xl font-bold"
                  >
                    Excluir TODAS as parcelas
                  </Button>
                  
                  {/* Botão que passa 'false' para excluir apenas a parcela selecionada */}
                  <Button 
                    onClick={() => onConfirm(false)} 
                    className="bg-orange-500 hover:bg-orange-600 text-white border-none py-3.5 rounded-2xl font-bold"
                  >
                    Excluir APENAS esta parcela
                  </Button>
                </>
              ) : (
                /* Botão padrão para compras à vista */
                <Button 
                  onClick={() => onConfirm(false)} 
                  className="bg-red-600 hover:bg-red-700 text-white border-none py-3.5 rounded-2xl font-bold"
                >
                  Sim, excluir agora
                </Button>
              )}
              
              <button 
                onClick={onClose} 
                className="mt-2 py-2 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cancelar e manter transação
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
// src/components/HelpModal.jsx
import React from "react";

const HelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-dark-400 p-6 rounded-lg shadow-lg w-96 max-h-[80vh] overflow-y-auto">
        <h3 className="text-light-200 text-xl font-semibold mb-4">Не можете войти?</h3>
        <div className="text-light-200 text-sm">
          <p>Если у вас возникают проблемы с входом через Яндекс или Google, проверьте следующие настройки:</p>

          <h4 className="mt-4 font-semibold">Включение IMAP в настройках Яндекс.Почты</h4>
          <p>Убедитесь, что в вашем почтовом аккаунте Яндекса включен доступ по IMAP:</p>
          <ol className="list-decimal list-inside mt-2">
            <li>
              Зайдите в{" "}
              <a href="https://mail.yandex.ru/#setup/client" target="_blank" rel="noopener noreferrer" className="text-blue-200 hover:underline">
                настройки Яндекс.Почты
              </a>.
            </li>
            <li>Перейдите в раздел "Почтовые программы".</li>
            <li>Включите опцию "Доступ к почтовому ящику с помощью почтовых клиентов".</li>
            <li>Сохраните изменения и попробуйте войти снова.</li>
          </ol>

          <h4 className="mt-4 font-semibold">Вход через Google</h4>
          <p>
            Наше приложение еще не проверено Google, поэтому для добавления вашего аккаунта обратитесь на{" "}
            <a href="mailto:bpronin@edu.hse.ru" className="text-blue-200 hover:underline">
              bpronin@edu.hse.ru
            </a>
            . Мы поможем вам подключить аккаунт вручную.
          </p>

          <p className="mt-4">Если проблема сохраняется, свяжитесь с поддержкой (<a href="mailto:bpronin@edu.hse.ru" className="text-blue-200 hover:underline">
              bpronin@edu.hse.ru
            </a>)</p>
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full bg-blue-200 text-white p-2 rounded hover:bg-blue-300"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};

export default HelpModal;
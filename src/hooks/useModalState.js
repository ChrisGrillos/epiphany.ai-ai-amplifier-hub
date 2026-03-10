import { useReducer } from 'react';

function modalReducer(state, action) {
  switch (action.type) {
    case 'SET':
      return { ...state, [action.key]: action.value };
    case 'OPEN':
      return { ...state, [action.key]: true };
    case 'CLOSE':
      return { ...state, [action.key]: false };
    case 'TOGGLE':
      return { ...state, [action.key]: !state[action.key] };
    default:
      return state;
  }
}

export default function useModalState(initialStates = {}) {
  const [modals, dispatch] = useReducer(modalReducer, initialStates);

  const setModalOpen = (key, value) => dispatch({ type: 'SET', key, value });
  const openModal = (key) => dispatch({ type: 'OPEN', key });
  const closeModal = (key) => dispatch({ type: 'CLOSE', key });
  const toggleModal = (key) => dispatch({ type: 'TOGGLE', key });

  return { modals, setModalOpen, openModal, closeModal, toggleModal };
}

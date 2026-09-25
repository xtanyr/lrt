import './LoadingState.css';

type LoadingStateProps = {
  label?: string;
  variant?: 'page' | 'panel' | 'bar';
};

export default function LoadingState({ label = 'Загружаем данные', variant = 'page' }: LoadingStateProps) {
  if (variant === 'bar') {
    return <div className="loading-bar" role="status" aria-live="polite" aria-label={label}><span /></div>;
  }

  return (
    <div className={`loading-state loading-state-${variant}`} role="status" aria-live="polite">
      <span className="loading-flower" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => <i key={index} />)}
      </span>
      <span>{label}</span>
    </div>
  );
}

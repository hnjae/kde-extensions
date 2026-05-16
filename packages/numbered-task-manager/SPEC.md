
목적: 프로그램의 주된 목적은, task-manager 에 아이콘과 표기해서, Meta+1-9 로 정확히 특정 윈도우를 바로 선택할수 위함임.

이때 숫자는, 좌하단 (즉 아이콘에) 에 겹쳐서 표기했으면 좋겠음. KDE 가 Fixed width 로 설정한 폰트를 사용할 것. 만일 KDE 에서 overlay 식으로 숫자를 표기하는게 어렵거나, 시인성이 어렵다면

```text
[number][icon][title of window]
```

식으로 표기해도 좋음.

디자인: icons-and-text task manager 와 유사

특징: `Meta+1-9` 키로 실행하는 애플리케이션이 변하는걸 원치 않음. Pin 된 아이콘은 항상 그 자리에 고정. (즉 icons-and text task manager 은 pin 된 아이콘을 실행하면, 그 자리에서 벗어나서 최우측에 새 윈도우를 만들지만, 그렇게 작동하지 않음.)

```text
[New tab - Brave][konsole icon][Foo - Dolphin]
```

식으로 윈도우 사이에 아이콘이 pin 되어 고정되는 느낌임.

----

특징 2: 윈도우를 겹치는걸 허용하지 않음.

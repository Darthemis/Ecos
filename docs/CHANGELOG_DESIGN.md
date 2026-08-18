# CHANGELOG DE DESIGN

Registro de toda alteração em decisões de design do projeto Ecos do Último Éon.

Este arquivo existe para que nenhuma decisão se perca, se inverta ou seja simplificada sem rastro. Alterações de código que **não** tocam decisões de design não pertencem aqui — vão no histórico do Git.

## Quando uma entrada é obrigatória

- uma decisão de `DECISOES_FECHADAS.md` muda, é reduzida ou é abandonada;
- um item de `EXPERIMENTOS_ABERTOS.md` é resolvido e vira decisão fechada;
- o GDD ou o Plano de Ação é alterado;
- uma implementação diverge de uma decisão fechada e a divergência é aceita.

Sem entrada aqui, a alteração não é válida — mesmo que o código já esteja escrito. Código existente nunca se torna automaticamente uma decisão de design. *(Plano §4.2)*

## Formato de entrada

```md
## AAAA-MM-DD — título curto

- **Decisão afetada:** item N de DECISOES_FECHADAS.md, ou item de EXPERIMENTOS_ABERTOS.md
- **Antes:** o que valia
- **Depois:** o que passa a valer
- **Justificativa:** qual protótipo ou playtest produziu a evidência
- **Aprovação humana:** quem aprovou e quando
- **GDD atualizado:** seções alteradas, ou "não aplicável"
- **Impacto no código:** módulos e testes afetados
```

---

## Entradas

*Nenhuma até o momento. A linha de base canônica foi estabelecida sem alterar o GDD nem o Plano.*

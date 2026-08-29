/**
 * A troca ferramenta/manual: um par de radios escondidos e `:checked ~`, sem estado
 * de React. Os dois painéis ficam no HTML servido, que é o que faz o texto do manual
 * valer como conteúdo indexável, e trocar de aba não desloca nada nem cria rolagem.
 *
 * Está em dois pedaços porque o CSS casa por irmão: os radios têm que vir antes de
 * tudo que reage a eles, e as abas ficam no cabeçalho, que é bem depois.
 */

/** Os radios. Primeiro filho do container que envolve cabeçalho e painéis. */
export function ToolTabInputs() {
  return (
    <>
      <input type="radio" name="tool-tab" id="tab-tool" defaultChecked className="tool-tab-input" />
      <input type="radio" name="tool-tab" id="tab-doc" className="tool-tab-input" />
    </>
  );
}

/** O par de abas, para o cabeçalho. */
export function ToolTabs() {
  return (
    <div className="tool-tabs">
      <label htmlFor="tab-tool">ferramenta</label>
      <label htmlFor="tab-doc">manual</label>
    </div>
  );
}

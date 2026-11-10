import { html, raw } from '../utils/html.js';
import { formatCurrency, formatNumber, hoyISO, initials, rangoPagina, totalPaginas } from '../../domain/formatters.js';
import { icon } from './icons.js';

export function pageHeader({ eyebrow = null, title, description = null, actions = null } = {}){
  return html`
    <header class="page-header">
      <div class="page-header-copy">
        ${ eyebrow ? html`<span class="eyebrow">${ eyebrow }</span>` : '' }
        <h1>${ title }</h1>
        ${ description ? html`<p>${ description }</p>` : '' }
      </div>
      ${ actions ? html`<div class="page-header-actions">${ actions }</div>` : '' }
    </header>
  `;
}

export function badge( texto, tono = 'neutral' ){
  return html`<span class="badge badge-${ tono }">${ texto }</span>`;
}

export function stockBadge( stock ){
  const cantidad = Number( stock ) || 0;
  if( cantidad <= 0 ) return badge( 'Agotado', 'danger' );
  if( cantidad <= 2 ) return badge( `${ cantidad } ${ cantidad === 1 ? 'ejemplar' : 'ejemplares' }`, 'warning' );
  return badge( `${ cantidad } ${ cantidad === 1 ? 'ejemplar' : 'ejemplares' }`, 'success' );
}

export function loanBadge( prestamo ){
  if( prestamo?.fechaDevolucion ) return badge( 'Devuelto', 'success' );
  const vencido = prestamo?.fechaTentativaDevolucion && prestamo.fechaTentativaDevolucion < hoyISO();
  if( vencido ) return badge( 'Vencido', 'danger' );
  return badge( 'Activo', 'warning' );
}

export function statCard({ label, value, hint = null, iconName = 'book', tone = 'primary' } = {}){
  return html`
    <article class="stat-card stat-${ tone }">
      <div class="stat-icon">${ icon( iconName, 22 ) }</div>
      <div class="stat-copy">
        <span class="stat-label">${ label }</span>
        <strong class="stat-value">${ value }</strong>
        ${ hint ? html`<span class="stat-hint">${ hint }</span>` : '' }
      </div>
    </article>
  `;
}

export function card({ title = null, subtitle = null, actions = null, body, className = '' } = {}){
  return html`
    <section class="card ${ className }">
      ${ title || actions ? html`
        <header class="card-head">
          <div>
            ${ title ? html`<h2>${ title }</h2>` : '' }
            ${ subtitle ? html`<p>${ subtitle }</p>` : '' }
          </div>
          ${ actions ? html`<div class="card-actions">${ actions }</div>` : '' }
        </header>
      ` : '' }
      <div class="card-body">${ body }</div>
    </section>
  `;
}

export function emptyState({ iconName = 'book-open', title = 'Sin resultados', message = 'No hay información para mostrar.', action = null } = {}){
  return html`
    <div class="empty-state">
      <span class="empty-icon">${ icon( iconName, 30 ) }</span>
      <h3>${ title }</h3>
      <p>${ message }</p>
      ${ action ? html`<div class="empty-action">${ action }</div>` : '' }
    </div>
  `;
}

export function errorState({ title = 'No se pudo cargar la información', message = 'Intenta de nuevo en unos segundos.', retry = true } = {}){
  return html`
    <div class="error-state" role="alert">
      <span class="error-icon">${ icon( 'alert', 30 ) }</span>
      <h2>${ title }</h2>
      <p>${ message }</p>
      ${ retry ? html`<button type="button" class="btn btn-primary" data-retry>${ icon( 'refresh', 18 ) } Reintentar</button>` : '' }
    </div>
  `;
}

function urlConPagina( basePath, query, pagina, pageParam = 'pagina' ){
  const parametros = new URLSearchParams();
  for( const [ clave, valor ] of Object.entries( query ?? {} ) ){
    if( valor !== undefined && valor !== null && valor !== '' ) parametros.set( clave, String( valor ) );
  }
  parametros.set( pageParam, String( pagina ) );
  return `${ basePath }?${ parametros.toString() }`;
}

export function pagination({ total = 0, pagina = 1, limite = 10, basePath = '', query = {}, pageParam = 'pagina' } = {}){
  const paginas = totalPaginas( total, limite );
  const actual = Math.max( 1, Number( pagina ) || 1 );

  if( total <= 0 ) return raw( '' );

  const desde = ( actual - 1 ) * limite + 1;
  const hasta = Math.min( actual * limite, total );
  const numeros = rangoPagina( actual, total, limite );

  return html`
    <nav class="pagination" aria-label="Paginación">
      <p class="pagination-summary">
        Mostrando <strong>${ formatNumber( desde ) }–${ formatNumber( hasta ) }</strong> de <strong>${ formatNumber( total ) }</strong>
      </p>
      <div class="pagination-controls">
        <a class="page-btn ${ actual <= 1 ? 'is-disabled' : '' }"
           href="${ urlConPagina( basePath, query, Math.max( 1, actual - 1 ), pageParam ) }"
           data-link
           ${ actual <= 1 ? raw( 'aria-disabled="true" tabindex="-1"' ) : '' }
           aria-label="Página anterior">
          ${ icon( 'chevron-left', 17 ) }
        </a>
        ${ numeros.map( numero => html`
          <a class="page-btn ${ numero === actual ? 'is-current' : '' }"
             href="${ urlConPagina( basePath, query, numero, pageParam ) }"
             data-link
             ${ numero === actual ? raw( 'aria-current="page"' ) : '' }>${ numero }</a>
        ` ) }
        <a class="page-btn ${ actual >= paginas ? 'is-disabled' : '' }"
           href="${ urlConPagina( basePath, query, Math.min( paginas, actual + 1 ), pageParam ) }"
           data-link
           ${ actual >= paginas ? raw( 'aria-disabled="true" tabindex="-1"' ) : '' }
           aria-label="Página siguiente">
          ${ icon( 'chevron-right', 17 ) }
        </a>
      </div>
    </nav>
  `;
}

export function searchBar({ value = '', placeholder = 'Buscar…', label = 'Buscar', hidden = {}, action = '', buttonLabel = 'Buscar' } = {}){
  return html`
    <form class="search-bar" data-search-form>
      ${ Object.entries( hidden ).map( ([ clave, valor ]) => html`<input type="hidden" name="${ clave }" value="${ valor }">` ) }
      <div class="search-input">
        ${ icon( 'search', 19 ) }
        <input type="search" name="q" value="${ value }" placeholder="${ placeholder }" aria-label="${ label }" autocomplete="off">
      </div>
      <button type="submit" class="btn btn-primary">${ buttonLabel }</button>
    </form>
  `;
}

function idCampo( nombre ){
  return `campo-${ String( nombre ).replace( /[^a-zA-Z0-9_-]/g, '-' ) }`;
}

export function field({
  label,
  name,
  type = 'text',
  value = '',
  placeholder = '',
  required = false,
  help = null,
  autocomplete = 'off',
  min = null,
  max = null,
  step = null,
  disabled = false,
  readonly = false,
  inputmode = null,
  maxlength = null,
  autofocus = false
} = {}){
  const id = idCampo( name );
  return html`
    <div class="field">
      <label for="${ id }">${ label }${ required ? html`<span class="req" aria-hidden="true">*</span>` : '' }</label>
      <input
        id="${ id }"
        name="${ name }"
        type="${ type }"
        value="${ value ?? '' }"
        placeholder="${ placeholder }"
        autocomplete="${ autocomplete }"
        ${ required ? raw( 'required' ) : '' }
        ${ disabled ? raw( 'disabled' ) : '' }
        ${ readonly ? raw( 'readonly' ) : '' }
        ${ autofocus ? raw( 'autofocus' ) : '' }
        ${ min !== null ? raw( `min="${ min }"` ) : '' }
        ${ max !== null ? raw( `max="${ max }"` ) : '' }
        ${ step !== null ? raw( `step="${ step }"` ) : '' }
        ${ inputmode !== null ? raw( `inputmode="${ inputmode }"` ) : '' }
        ${ maxlength !== null ? raw( `maxlength="${ maxlength }"` ) : '' }
        ${ help ? raw( `aria-describedby="${ id }-help"` ) : '' }
      >
      ${ help ? html`<span class="field-help" id="${ id }-help">${ help }</span>` : '' }
      <span class="field-error" data-error-for="${ name }"></span>
    </div>
  `;
}

export function selectField({ label, name, options = [], value = '', required = false, help = null, disabled = false, placeholder = null } = {}){
  const id = idCampo( name );
  return html`
    <div class="field">
      <label for="${ id }">${ label }${ required ? html`<span class="req" aria-hidden="true">*</span>` : '' }</label>
      <select id="${ id }" name="${ name }" ${ required ? raw( 'required' ) : '' } ${ disabled ? raw( 'disabled' ) : '' }>
        ${ placeholder ? html`<option value="">${ placeholder }</option>` : '' }
        ${ options.map( opcion => html`
          <option value="${ opcion.value }" ${ String( opcion.value ) === String( value ) ? raw( 'selected' ) : '' } ${ opcion.disabled ? raw( 'disabled' ) : '' }>
            ${ opcion.label }
          </option>
        ` ) }
      </select>
      ${ help ? html`<span class="field-help">${ help }</span>` : '' }
      <span class="field-error" data-error-for="${ name }"></span>
    </div>
  `;
}

export function textareaField({ label, name, value = '', placeholder = '', required = false, help = null, rows = 3 } = {}){
  const id = idCampo( name );
  return html`
    <div class="field field-full">
      <label for="${ id }">${ label }${ required ? html`<span class="req" aria-hidden="true">*</span>` : '' }</label>
      <textarea id="${ id }" name="${ name }" rows="${ rows }" placeholder="${ placeholder }" ${ required ? raw( 'required' ) : '' }>${ value }</textarea>
      ${ help ? html`<span class="field-help">${ help }</span>` : '' }
      <span class="field-error" data-error-for="${ name }"></span>
    </div>
  `;
}

export function bookCover({ titulo = '', autor = '', small = false } = {}){
  const texto = String( titulo || 'Libro' );
  const semilla = Array.from( texto ).reduce( ( suma, caracter ) => ( suma * 31 + caracter.codePointAt( 0 ) ) % 360, 11 );
  return html`
    <div class="book-cover ${ small ? 'book-cover-sm' : '' }" style="--cover-hue: ${ semilla }" aria-hidden="true">
      <span class="book-spine"></span>
      <span class="book-letter">${ texto.trim().charAt( 0 ).toUpperCase() }</span>
      <span class="book-lines"></span>
      <span class="book-author">${ String( autor ).split( ' ' )[0] ?? '' }</span>
    </div>
  `;
}

export function avatar( nombre, size = 'md' ){
  return html`<span class="avatar avatar-${ size }" aria-hidden="true">${ initials( nombre ) }</span>`;
}

export function skeletonTable( filas = 5, columnas = 5 ){
  return html`
    <div class="skeleton-table" aria-hidden="true">
      ${ Array.from( { length: filas }, () => html`
        <div class="skeleton-row">
          ${ Array.from( { length: columnas }, ( _, indice ) => html`<span class="skeleton skeleton-cell ${ indice === 0 ? 'skeleton-wide' : '' }"></span>` ) }
        </div>
      ` ) }
    </div>
  `;
}

export function loadingScreen( mensaje = 'Cargando información…' ){
  return html`
    <div class="loading-screen" role="status" aria-live="polite">
      <span class="spinner" aria-hidden="true"></span>
      <span>${ mensaje }</span>
    </div>
  `;
}

export function money( valor ){
  return html`<span class="money">${ formatCurrency( valor ) }</span>`;
}

export function infoRow( label, value, iconName = null ){
  return html`
    <div class="info-row">
      ${ iconName ? html`<span class="info-icon">${ icon( iconName, 17 ) }</span>` : '' }
      <span class="info-label">${ label }</span>
      <span class="info-value">${ value ?? '—' }</span>
    </div>
  `;
}

export function detailGrid( items ){
  return html`
    <div class="detail-grid">
      ${ items.map( item => html`
        <div class="detail-item">
          <span>${ item.label }</span>
          <strong>${ item.value ?? '—' }</strong>
        </div>
      ` ) }
    </div>
  `;
}

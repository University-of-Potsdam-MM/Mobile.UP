# capacitor-dark-mode-android

Custom Capacitor Plugin.
Checks natively if Android is in Dark Mode. Fires a native event that is then handled by the web framework.

## API

<docgen-index>

- [`isDarkModeOn()`](#isdarkmodeon)
- [`addListener('darkModeStateChanged', ...)`](#addlistenerdarkmodestatechanged-)
- [`registerDarkModeChangeListener()`](#registerdarkmodechangelistener)
- [Interfaces](#interfaces)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### isDarkModeOn()

```typescript
isDarkModeOn() => Promise<any>
```

**Returns:** <code>Promise&lt;any&gt;</code>

---

### addListener('darkModeStateChanged', ...)

```typescript
addListener(eventName: 'darkModeStateChanged', listenerFunc: (state: any) => void) => PluginListenerHandle
```

| Param              | Type                                 |
| ------------------ | ------------------------------------ |
| **`eventName`**    | <code>'darkModeStateChanged'</code>  |
| **`listenerFunc`** | <code>(state: any) =&gt; void</code> |

**Returns:** <code><a href="#pluginlistenerhandle">PluginListenerHandle</a></code>

---

### registerDarkModeChangeListener()

```typescript
registerDarkModeChangeListener() => void
```

---

### Interfaces

#### PluginListenerHandle

| Prop         | Type                                      |
| ------------ | ----------------------------------------- |
| **`remove`** | <code>() =&gt; Promise&lt;void&gt;</code> |

</docgen-api>
